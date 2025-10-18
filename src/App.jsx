import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const API_URL = 'https://cvd-backend.onrender.com/api/simulate'

  const simulateOne = async (file, cvdType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('cvd_type', cvdType)
    const res = await fetch(API_URL, { method: 'POST', body: formData })
    if (!res.ok) {
      let detail = ''
      try { detail = (await res.json()).detail || '' } catch {}
      throw new Error(detail || `Simulation failed (${cvdType}): ${res.status}`)
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }

  const handleChooseFile = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setError(null)
    try {
      const originalUrl = URL.createObjectURL(file)
      const types = ['protanopia', 'deuteranopia', 'tritanopia']
      const results = await Promise.all(types.map(t => simulateOne(file, t)))
      const images = {
        protanopia: results[0],
        deuteranopia: results[1],
        tritanopia: results[2],
      }
      navigate('/results', { state: { originalUrl, images } })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed')
    } finally {
      setIsLoading(false)
      // clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 sm:px-10 py-3">
              <div className="flex items-center gap-4 text-slate-900 dark:text-slate-50">
                <div className="size-6 text-primary">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                    <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor" fillRule="evenodd"></path>
                  </svg>
                </div>
                <h2 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em]">CVD Simulation</h2>
              </div>
              <div className="flex flex-1 justify-end gap-8">
                <div className="hidden sm:flex items-center gap-9">
                
                </div>
                
              </div>
            </header>
            <main className="flex-1 py-10 px-4">
              <div className="flex flex-wrap justify-between gap-3 p-4 mb-8">
                <div className="flex min-w-72 flex-col gap-3 text-center mx-auto">
                  <p className="text-slate-900 dark:text-slate-50 text-4xl font-black leading-tight tracking-[-0.033em]">Simulate Color Vision Deficiency</p>
                  <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Upload an image to see how it appears to people with different types of color blindness.</p>
                </div>
              </div>
              <div className="flex flex-col p-4">
                <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 py-14 bg-slate-100 dark:bg-slate-900/40">
                  <div className="flex max-w-[480px] flex-col items-center gap-2">
                    <p className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">Drag and drop an image here, or click to select a file</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal max-w-[480px] text-center">Supported formats: JPEG, PNG, SVG</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
                  <button disabled={isLoading} onClick={handleChooseFile} className="flex min-w-[140px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-slate-50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 disabled:opacity-60">
                    <span className="truncate">{isLoading ? 'Processing…' : 'Upload Image'}</span>
                  </button>
                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}
                </div>
              </div>
              {/* Optional progress / tips section can go here */}
              <div className="mt-16">
                <h2 className="text-slate-900 dark:text-slate-50 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5 text-center">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8 p-4 mt-4">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined !text-4xl">upload_file</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">1. Upload Image</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Select an image from your device or drag and drop it into the upload area.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined !text-4xl">sync</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">2. Process Image</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Our tool analyzes your image and generates simulations for various types of color vision deficiency.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex items-center justify-center size-16 rounded-full bg-primary/20 text-primary">
                      <span className="material-symbols-outlined !text-4xl">visibility</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">3. View Results</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Compare the original image side-by-side with the simulated versions to identify potential accessibility issues.</p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
