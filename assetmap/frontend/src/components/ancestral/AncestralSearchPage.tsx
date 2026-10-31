import { useState, useEffect } from 'react'
import { AncestralSearchForm }  from './AncestralSearchForm'
import { AncestralResultCard }  from './AncestralResultCard'
import { OfflineGuide }         from './OfflineGuide'
import { Map, ArrowLeft, Loader2, FileX } from 'lucide-react'
import { api }                  from '../../services/api'

type Stage = 'form' | 'searching' | 'results' | 'no_results' | 'offline'

export default function AncestralSearchPage() {
  const [stage,     setStage]     = useState<Stage>('form')
  const [searchId,  setSearchId]  = useState<string|null>(null)
  const [searchData,setSearchData]= useState<any>(null)
  const [pollCount, setPollCount] = useState(0)

  const handleSearch = async (formData: any) => {
    setStage('searching')
    try {
      // Shared client: API base URL, cookie credentials and token refresh
      const { data } = await api.post('/ancestral/search', formData)
      setSearchId(data.data.searchId)
    } catch (err: any) {
      const apiError = err?.response?.data?.error
      if (apiError?.code === 'PLAN_GATE') {
        window.dispatchEvent(new CustomEvent('plan-gate', { detail: apiError }))
        setStage('form')
        return
      }
      console.error(err)
      alert('Failed to start search. Please try again.')
      setStage('form')
    }
  }

  // Poll for results
  useEffect(() => {
    if (!searchId || stage !== 'searching') return

    const poll = async () => {
      try {
        const { data } = await api.get(`/ancestral/search/${searchId}`)

        if (data.data?.isComplete) {
          setSearchData(data.data)
          if (data.data.search_method === 'offline_guide') {
            setStage('offline')
          } else if (data.data.hasResults) {
            setStage('results')
          } else {
            setStage('no_results')
          }
          return
        }
        setPollCount(c => c + 1)
      } catch (err) {
        // Ignore network errors during polling (common when backend auto-reloads in dev)
        console.warn('Polling error:', err)
      }
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [searchId, stage])

  const handleConfirm = async (resultId: string, notes?: string) => {
    await api.post(`/ancestral/results/${resultId}/confirm`, { notes })
    // Refresh results
    if (searchId) {
      const { data } = await api.get(`/ancestral/search/${searchId}`)
      setSearchData(data.data)
    }
  }

  const handleReject = async (resultId: string) => {
    await api.post(`/ancestral/results/${resultId}/reject`)
    if (searchId) {
      const { data } = await api.get(`/ancestral/search/${searchId}`)
      setSearchData(data.data)
    }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto pt-2 pb-0 relative flex flex-col md:max-h-[calc(100vh-180px)] md:overflow-hidden">
      
      {/* Header */}
      {stage === 'form' ? (
        <div className="w-full max-w-3xl shrink-0">
          <div className="flex flex-col items-start text-left gap-1 mb-4">
            <h1 className="text-[26px] font-sans font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-start gap-2.5">
              <Map className="size-7 text-lime-500" />
              Find Lost Ancestral Property
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
              Search government land records by your ancestor's name. No documents needed.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-start px-0 pt-1 mb-4 shrink-0">
          <button
            onClick={() => setStage('form')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1A1D27]/90 backdrop-blur-md border border-zinc-300 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-visible md:overflow-hidden pr-2 pb-2 min-h-0">
        <div className={`w-full ${stage === 'form' ? "max-w-3xl" : "max-w-5xl"}`}>
          
          {/* Stage: Form */}
          {stage === 'form' && (
            <AncestralSearchForm onSubmit={handleSearch} />
          )}

          {/* Stage: Searching */}
          {stage === 'searching' && (
            <div className="flex flex-col items-center justify-center p-12 bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[28px] backdrop-blur-md">
              <Loader2 className="size-10 animate-spin text-lime-500 mb-6" />
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Searching land records...
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-[24rem] text-center">
                We're checking state land portals and trying name variants. This takes 30–60 seconds.
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[20rem]">
                {[
                  'Generating name spelling variants',
                  'Searching district land records',
                  'Running AI confidence scoring',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className={`size-5 rounded-full flex items-center justify-center border ${pollCount > i * 3 ? 'bg-lime-500 border-lime-500 text-white' : 'border-zinc-300 dark:border-zinc-700 text-transparent'}`}>
                      {pollCount > i * 3 && <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={pollCount > i * 3 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage: Results */}
          {stage === 'results' && searchData && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
              <div className="flex justify-between items-center bg-white/80 dark:bg-white/[0.04] backdrop-blur-md border border-zinc-200 dark:border-white/10 rounded-2xl p-4">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
                    {searchData.results.length} possible match{searchData.results.length !== 1 ? 'es' : ''} found
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                    for "{searchData.ancestor_name}" in {searchData.state}
                  </span>
                </div>
                <button
                  onClick={() => setStage('form')}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  Search again
                </button>
              </div>

              {searchData.results
                .sort((a: any, b: any) => b.confidence_score - a.confidence_score)
                .map((result: any) => (
                  <AncestralResultCard
                    key={result.id}
                    result={result}
                    onConfirm={handleConfirm}
                    onReject={handleReject}
                  />
                ))
              }

              <div className="mt-4 p-4 bg-blue-50/80 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-500/20 rounded-xl text-sm text-blue-800 dark:text-blue-300 flex items-start gap-3">
                <span className="text-xl leading-none">ℹ️</span>
                <p>
                  These results are leads from government revenue records, not legal proof of ownership. 
                  Confirm with the portal and consult a property lawyer before claiming.
                </p>
              </div>
            </div>
          )}

          {/* Stage: No results */}
          {stage === 'no_results' && (
            <div className="flex flex-col items-center justify-center p-12 bg-white/60 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-[28px] backdrop-blur-md text-center">
              <FileX className="size-12 text-zinc-400 mb-4" />
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                No matches found online
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-[28rem]">
                This could mean the village records aren't yet digitised, the name spelling in old records differs significantly, or the property is in a state with offline-only records.
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => setStage('form')}
                  className="px-5 py-2.5 rounded-xl bg-lime-300 hover:bg-lime-400 text-foreground font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Try different name
                </button>
                <button
                  onClick={async () => {
                    if (searchId) {
                      const { data } = await api.get(`/ancestral/search/${searchId}/offline-guide`)
                      setSearchData({ ...searchData, offlineGuide: data.data })
                      setStage('offline')
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  Get offline guide
                </button>
              </div>
            </div>
          )}

          {/* Stage: Offline guide */}
          {stage === 'offline' && searchData && (
            <OfflineGuide
              guide={searchData.offlineGuide ?? searchData}
              onBack={() => setStage('form')}
            />
          )}

        </div>
      </div>
    </div>
  )
}
