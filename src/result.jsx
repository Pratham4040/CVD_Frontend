import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ResultPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const originalUrl = state?.originalUrl
    const images = state?.images || {}
        const [palette, setPalette] = useState(null)
        const [analysis, setAnalysis] = useState(null)
        const [busy, setBusy] = useState(false)
        const [err, setErr] = useState(null)

        const API_BASE = (() => {
            const fromEnvBase = import.meta.env.VITE_API_BASE
            const fromEnvUrl = import.meta.env.VITE_API_URL
            if (fromEnvBase) return fromEnvBase.replace(/\/$/, '')
            if (fromEnvUrl) {
                try { return new URL(fromEnvUrl).origin } catch {}
            }
      return 'https://cvd-backend.onrender.com'
    })()
        const fetchOriginalBlob = async () => {
            const res = await fetch(originalUrl)
            if (!res.ok) throw new Error('Failed to read original image')
            return await res.blob()
        }

        const handleAnalyze = async () => {
            setBusy(true); setErr(null)
            try {
                // 1) extract palette
                const blob = await fetchOriginalBlob()
                const fd = new FormData()
                fd.append('file', new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' }))
                fd.append('k', '5')
                const pRes = await fetch(`${API_BASE}/api/palette`, { method: 'POST', body: fd })
                if (!pRes.ok) throw new Error('Palette extraction failed')
                const pJson = await pRes.json()
                setPalette(pJson.palette)
                const colors = (pJson.palette || []).map(x => x.hex)
                // 2) build pairs: each color on white and on gray-900
                const pairs = []
                colors.forEach(hx => {
                    pairs.push({ fg: hx, bg: '#ffffff' })
                    pairs.push({ fg: hx, bg: '#111827' })
                })
                const aRes = await fetch(`${API_BASE}/api/palette/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ palette: colors, pairs })
                })
                if (!aRes.ok) throw new Error('Analysis failed')
                const aJson = await aRes.json()
                setAnalysis(aJson)
            } catch (e) {
                console.error(e)
                setErr(e.message || 'Analyze failed')
            } finally {
                setBusy(false)
            }
        }

        const handleDownloadTokens = async () => {
            try {
                const colors = (palette || []).map(x => x.hex)
                if (!colors.length) return
                const tRes = await fetch(`${API_BASE}/api/palette/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ palette: colors })
                })
                if (!tRes.ok) throw new Error('Export failed')
                const tJson = await tRes.json()
                // download CSS
                const cssBlob = new Blob([tJson.cssVariables], { type: 'text/css' })
                const cssUrl = URL.createObjectURL(cssBlob)
                const a1 = document.createElement('a')
                a1.href = cssUrl; a1.download = 'tokens.css'; a1.click()
                URL.revokeObjectURL(cssUrl)
                // download tailwind snippet
                const twBlob = new Blob([tJson.tailwindSnippet], { type: 'text/plain' })
                const twUrl = URL.createObjectURL(twBlob)
                const a2 = document.createElement('a')
                a2.href = twUrl; a2.download = 'tailwind-colors.txt'; a2.click()
                URL.revokeObjectURL(twUrl)
                // download diff patch
                const diffBlob = new Blob([tJson.diff], { type: 'text/plain' })
                const diffUrl = URL.createObjectURL(diffBlob)
                const a3 = document.createElement('a')
                a3.href = diffUrl; a3.download = 'tokens.patch'; a3.click()
                URL.revokeObjectURL(diffUrl)
            } catch (e) {
                console.error(e)
                setErr(e.message || 'Download failed')
            }
        }

    // If navigated directly without state, go back home
    if (!originalUrl) {
        navigate('/')
        return null
    }

    return (
<div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
<div className="layout-container flex h-full grow flex-col">
<div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
<div className="layout-content-container flex flex-col max-w-[960px] flex-1">
<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7eff3] dark:border-b-gray-700 px-4 sm:px-10 py-3">
<div className="flex items-center gap-4 text-[#0d171b] dark:text-slate-50">
<div className="size-6 text-primary">
<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
<path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fillRule="evenodd"></path>
</svg>
</div>
<h2 className="text-[#0d171b] dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em]">CVD Simulation</h2>
</div>
<button onClick={() => navigate('/')} className="flex min-w-[140px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark">
<span className="truncate">New Simulation</span>
</button>
</header>
<main className="flex-1">
<div className="flex flex-wrap justify-between gap-3 p-4 py-8 sm:p-10">
<div className="flex min-w-72 flex-col gap-3">
<p className="text-[#0d171b] dark:text-slate-50 text-4xl font-black leading-tight tracking-[-0.033em]">CVD Simulation Results</p>
<p className="text-[#4c809a] dark:text-gray-400 text-base font-normal leading-normal">Compare your image with different color vision deficiency simulations.</p>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 sm:p-10">
<div className="flex flex-col gap-3 pb-3">
<div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-center bg-no-repeat bg-contain rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/60" data-alt="Original uploaded image." style={{ backgroundImage: `url("${originalUrl}")` }}></div>
<p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal">Original</p>
</div>
<div className="flex flex-col gap-3 pb-3">
<div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-center bg-no-repeat bg-contain rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/60" data-alt="Protanopia simulation." style={{ backgroundImage: `url("${images.protanopia}")` }}></div>
<div className="flex justify-between items-center">
<p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal">Protanopia</p>
<a className="flex items-center gap-2 text-primary dark:text-primary/90 text-sm font-medium leading-normal hover:underline" download href={images.protanopia}>
<span className="material-symbols-outlined text-base">download</span>
                                        Download
                                    </a>
</div>
</div>
<div className="flex flex-col gap-3 pb-3">
<div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-center bg-no-repeat bg-contain rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/60" data-alt="Deuteranopia simulation." style={{ backgroundImage: `url("${images.deuteranopia}")` }}></div>
<div className="flex justify-between items-center">
<p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal">Deuteranopia</p>
<a className="flex items-center gap-2 text-primary dark:text-primary/90 text-sm font-medium leading-normal hover:underline" download href={images.deuteranopia}>
<span className="material-symbols-outlined text-base">download</span>
                                        Download
                                    </a>
</div>
</div>
<div className="flex flex-col gap-3 pb-3">
<div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-center bg-no-repeat bg-contain rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/60" data-alt="Tritanopia simulation." style={{ backgroundImage: `url("${images.tritanopia}")` }}></div>
<div className="flex justify-between items-center">
<p className="text-[#0d171b] dark:text-slate-50 text-base font-medium leading-normal">Tritanopia</p>
<a className="flex items-center gap-2 text-primary dark:text-primary/90 text-sm font-medium leading-normal hover:underline" download href={images.tritanopia}>
<span className="material-symbols-outlined text-base">download</span>
                                        Download
                                    </a>
</div>
</div>
</div>
{/* Palette & Accessibility */}
{/* Palette & Accessibility */}
<div className="px-4 sm:px-10 pb-16">
    <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-8">
        <h2 className="text-[#0d171b] dark:text-slate-50 text-2xl font-bold mb-2">Color Accessibility Check</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Analyze your image's colors to ensure they're easy to see and distinguish for people with color vision differences.</p>
        <div className="flex flex-wrap items-center gap-3 mb-6">
            <button disabled={busy} onClick={handleAnalyze} className="flex items-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-60 hover:bg-primary/90">{busy ? 'Analyzing…' : 'Check My Colors'}</button>
            <button disabled={busy || !palette} onClick={handleDownloadTokens} className="flex items-center rounded-lg h-10 px-4 bg-slate-800 text-white text-sm font-bold disabled:opacity-60 hover:bg-slate-700">Export as Design Tokens</button>
            {err && <span className="text-red-500 text-sm">{err}</span>}
        </div>
    </div>
    {palette && (
        <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2 text-[#0d171b] dark:text-slate-50">Main Colors Found</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">These are the dominant colors in your image, sorted by how much they appear.</p>
            <div className="flex flex-wrap gap-4">
                {palette.map((c, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 min-w-[120px]">
                        <div className="w-16 h-16 rounded-lg shadow-sm" style={{ background: c.hex }} />
                        <div className="text-center">
                            <div className="text-sm font-mono text-slate-700 dark:text-slate-200">{c.hex}</div>
                            <div className="text-xs text-slate-500">{Math.round(c.percent*100)}% of image</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )}
    {/* CVD Visibility Scores */}
    {analysis?.cvdScores && (
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'protanopia', label: 'Protanopia', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🟥' },
          { key: 'deuteranopia', label: 'Deuteranopia', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🟩' },
          { key: 'tritanopia', label: 'Tritanopia', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🟦' },
          { key: 'overall', label: 'Overall', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '⭐' },
        ].map(({ key, label, color, icon }) => (
          <div key={key} className={`rounded-xl p-5 flex flex-col items-center shadow border border-slate-200 dark:border-slate-700 ${color}`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-lg font-bold mb-1">{label}</div>
            <div className="text-2xl font-black">{analysis.cvdScores[key]}<span className="text-base font-normal">/100</span></div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 text-center">
              {key === 'overall' ? 'Average accessibility for all types' : `Visibility for ${label.toLowerCase()} (higher is better)`}
            </div>
          </div>
        ))}
      </div>
    )}
    {analysis && (
        <div className="space-y-8">
            {/* Readability Check */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-xl">📖</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1 text-[#0d171b] dark:text-slate-50">Readability Test</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Checks if text would be easy to read on light and dark backgrounds. Pass = easy to read.</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {(analysis.wcag || []).map((r, i) => {
                        const bgName = r.bg === '#ffffff' ? 'white background' : 'dark background'
                        return (
                            <div key={i} className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                    <div className="w-10 h-10 rounded-lg shadow-sm flex-shrink-0" style={{ background: r.fg, border: '2px solid #e5e7eb' }} />
                                    <div className="text-sm">
                                        <div className="text-slate-900 dark:text-slate-100 font-medium">Color {r.fg}</div>
                                        <div className="text-slate-500 text-xs">on {bgName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 mb-1">Contrast: {r.contrast}:1</div>
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${r.passAA ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {r.passAA ? '✓ Easy to read' : '✗ Hard to read'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {(analysis.wcag || []).length === 0 && (
                    <p className="text-slate-500 text-sm italic">No contrast pairs to check.</p>
                )}
            </div>

            {/* Color Confusion Risk */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-purple-600 dark:text-purple-400 text-xl">👁️</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1 text-[#0d171b] dark:text-slate-50">Color Blindness Check</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Shows how well these color pairs work for people with color vision differences. Checks both similarity and readability.</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {(analysis.cvd || [])
                        .filter(r => !r.readable || r.risk >= 0.3) // Show problems first
                        .sort((a,b) => {
                            if (!a.readable && b.readable) return -1
                            if (a.readable && !b.readable) return 1
                            return b.risk - a.risk
                        })
                        .slice(0,10)
                        .map((r, i) => {
                        const riskPercent = Math.round(r.risk*100)
                        const hasContrastIssue = !r.readable
                        const contrastDrop = r.contrastLoss > 1.0
                        
                        return (
                            <div key={i} className={`bg-white dark:bg-slate-800 border-2 rounded-lg p-4 ${hasContrastIssue ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'}`}>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="flex gap-2 flex-shrink-0">
                                            <div className="w-12 h-12 rounded-lg shadow-sm" style={{ background: r.c1, border: '2px solid #e5e7eb' }} />
                                            <div className="w-12 h-12 rounded-lg shadow-sm" style={{ background: r.c2, border: '2px solid #e5e7eb' }} />
                                        </div>
                                        <div className="text-sm flex-1 min-w-0">
                                            <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                                                {r.c1} + {r.c2}
                                            </div>
                                            {hasContrastIssue ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                            ⚠️ Hard to read
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                                        In <span className="font-semibold">{r.worstCVD}</span>: contrast drops to {r.cvdContrast}:1
                                                        <br/>
                                                        <span className="text-red-600 dark:text-red-400">Text might be unreadable (needs 3.0+ for large text)</span>
                                                    </div>
                                                </div>
                                            ) : contrastDrop ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                            {riskPercent}% confusion risk
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                                        Contrast: {r.originalContrast}:1 → {r.cvdContrast}:1 in {r.worstCVD}
                                                        <br/>
                                                        <span className="text-amber-600 dark:text-amber-400">These colors may look similar</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            ✓ Accessible
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        Contrast: {r.cvdContrast}:1 (readable)
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {(analysis.cvd || []).length === 0 && (
                    <p className="text-slate-500 text-sm italic">No color pairs found.</p>
                )}
            </div>
            {/* Suggestions */}
            {analysis.suggestions?.length ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-xl">💡</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1 text-[#0d171b] dark:text-slate-50">Suggested Improvements</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Simple color changes that would make your design more accessible.</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {analysis.suggestions.map((s, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                {s.type === 'contrast' ? (
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                            <div className="flex gap-2 items-center">
                                                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ background: s.pair.fg, border: '2px solid #e5e7eb' }} />
                                                <span className="text-slate-400">→</span>
                                                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ background: s.suggestedFg, border: '2px solid #e5e7eb' }} />
                                            </div>
                                            <div className="text-sm">
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">Better text color</div>
                                                <div className="text-slate-500 text-xs">Change {s.pair.fg} to {s.suggestedFg}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                            +{s.delta.toFixed(1)} easier to read
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                            <div className="flex gap-2 items-center">
                                                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ background: s.target, border: '2px solid #e5e7eb' }} />
                                                <span className="text-slate-400">→</span>
                                                <div className="w-10 h-10 rounded-lg shadow-sm" style={{ background: s.suggested, border: '2px solid #e5e7eb' }} />
                                            </div>
                                            <div className="text-sm">
                                                <div className="text-slate-900 dark:text-slate-100 font-medium">Less confusing color</div>
                                                <div className="text-slate-500 text-xs">Change {s.target} to {s.suggested}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                            More distinct
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )}
</div>
</main>
</div>
</div>
</div>
</div>    
        )
}
