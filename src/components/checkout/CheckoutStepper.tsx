import { Check } from 'lucide-react'

const steps = [
  { id: 1, label: 'Giỏ hàng' },
  { id: 2, label: 'Thanh toán' },
  { id: 3, label: 'Hoàn tất' },
]

export default function CheckoutStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const done = step.id < currentStep
        const active = step.id === currentStep
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-extrabold transition ${
                  done
                    ? 'border-primary bg-primary text-white'
                    : active
                    ? 'border-primary bg-white text-primary'
                    : 'border-neutral-200 bg-white text-neutral-400'
                }`}
              >
                {done ? <Check size={16} /> : step.id}
              </div>
              <span className={`mt-1.5 text-xs font-bold ${active ? 'text-primary' : done ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mb-4 mx-2 h-0.5 w-12 sm:w-20 transition ${done ? 'bg-primary' : 'bg-neutral-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
