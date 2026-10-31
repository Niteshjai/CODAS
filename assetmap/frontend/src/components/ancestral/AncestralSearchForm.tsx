import { useState, useEffect } from 'react'
import { api } from '../../services/api'

interface Props {
  onSubmit: (data: any) => void
}

export function AncestralSearchForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState({
    ancestorName: '',
    relationship: '',
    relationshipLabel: '',
    state: '',
    district: '',
    taluka: '',
    village: '',
    surveyNumber: '',
    approximateDecade: '',
    additionalClues: ''
  })
  const [states, setStates] = useState<{value:string, label:string, method:string}[]>([])

  useEffect(() => {
    api.get('/ancestral/states')
      .then(({ data }) => {
        if (data.success) {
          setStates(data.data)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-gradient-to-br from-zinc-200/90 via-zinc-100/90 to-zinc-300/90 dark:from-[#1A1D27]/95 dark:via-[#21253A]/95 dark:to-[#1A1D27]/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-zinc-300 dark:border-[#2E3148] space-y-4 text-left">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Ancestor's Name *</label>
          <input
            name="ancestorName"
            value={formData.ancestorName}
            onChange={handleChange}
            required
            placeholder="e.g. Ramesh Kumar Sharma"
            className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Relationship *</label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition appearance-none"
            >
              <option value="">Select...</option>
              <option value="grandfather">Grandfather</option>
              <option value="grandmother">Grandmother</option>
              <option value="great_grandfather">Great Grandfather</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="uncle">Uncle</option>
              <option value="other_ancestor">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">State *</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition appearance-none"
            >
              <option value="">Select State...</option>
              {states.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">District</label>
            <input
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="e.g. Pune"
              className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Taluka / Tehsil</label>
            <input
              name="taluka"
              value={formData.taluka}
              onChange={handleChange}
              placeholder="e.g. Haveli"
              className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Village</label>
            <input
              name="village"
              value={formData.village}
              onChange={handleChange}
              placeholder="e.g. Wagholi"
              className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5">Additional Clues (Optional)</label>
          <textarea
            name="additionalClues"
            value={formData.additionalClues}
            onChange={handleChange}
            placeholder="Any other details like approximate decade (1980s), nearby landmarks, survey numbers, etc."
            className="w-full px-4 py-2 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-zinc-900 dark:text-white text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400 transition min-h-[80px] resize-y"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-6 rounded-2xl bg-lime-300 hover:bg-lime-400 text-zinc-950 font-bold text-base shadow-[0_0_20px_rgba(190,242,100,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          Search Land Records
        </button>
      </form>
    </div>
  )
}
