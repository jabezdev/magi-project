import { ICONS } from '../../../constants/icons'

export const SettingsHelpers = {
    addHeader(container: HTMLElement, title: string, subtitle: string) {
        const div = document.createElement('div')
        div.className = 'mb-8 border-b-2 border-zinc-700 pb-4'
        div.innerHTML = `
            <h2 class="text-3xl font-black text-white uppercase tracking-tight">${title}</h2>
            <p class="text-zinc-400 text-base mt-2 font-medium">${subtitle}</p>
        `
        container.appendChild(div)
    },

    createSection(title?: string) {
        const div = document.createElement('div')
        div.className = 'space-y-6 bg-zinc-900 border-2 border-zinc-700 p-6'
        if (title) {
            const h = document.createElement('h3')
            h.className = 'text-sm font-black text-blue-400 uppercase tracking-widest mb-6 border-b border-zinc-700 pb-2'
            h.textContent = title
            div.appendChild(h)
        }
        return div
    },

    createGroupLabel(text: string) {
        const div = document.createElement('div')
        div.className = 'text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 mt-6'
        div.textContent = text
        return div
    },

    createTextInput(label: string, value: string, onChange: (val: string) => void, readonly = false) {
        const div = document.createElement('div')
        div.className = 'flex flex-col gap-2'
        div.innerHTML = `<label class="text-sm font-bold text-zinc-400 uppercase tracking-wide">${label}</label>`

        const input = document.createElement('input')
        input.type = 'text'
        input.value = value
        input.className = `w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:shadow-[0px_0px_15px_rgba(59,130,246,0.3)] transition-all ${readonly ? 'opacity-50 cursor-not-allowed bg-zinc-900' : ''}`
        if (readonly) input.readOnly = true

        input.addEventListener('input', (e) => onChange((e.target as HTMLInputElement).value))
        div.appendChild(input)
        return div
    },

    createNumberInput(label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void) {
        const div = document.createElement('div')
        div.className = 'flex flex-col gap-2'
        div.innerHTML = `<label class="text-sm font-bold text-zinc-400 uppercase tracking-wide">${label}</label>`

        const input = document.createElement('input')
        input.type = 'number'
        input.value = String(value)
        input.min = String(min)
        input.max = String(max)
        input.step = String(step)
        input.className = 'w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:shadow-[0px_0px_15px_rgba(59,130,246,0.3)] transition-all'

        input.addEventListener('input', (e) => onChange(parseFloat((e.target as HTMLInputElement).value)))
        div.appendChild(input)
        return div
    },

    createColorInput(label: string, value: string, onChange: (val: string) => void) {
        const div = document.createElement('div')
        div.className = 'flex items-center justify-between bg-zinc-900 border-2 border-zinc-700 px-4 py-3'

        const labelEl = document.createElement('span')
        labelEl.className = 'text-sm font-bold text-zinc-300 uppercase tracking-wide'
        labelEl.textContent = label

        const wrapper = document.createElement('div')
        wrapper.className = 'flex items-center gap-3'

        const text = document.createElement('span')
        text.className = 'text-xs text-zinc-400 font-mono font-bold uppercase'
        text.textContent = value

        const input = document.createElement('input')
        input.type = 'color'
        input.value = value
        input.className = 'w-10 h-10 border-2 border-zinc-600 p-0 cursor-pointer bg-transparent'

        input.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value
            onChange(val)
            text.textContent = val
        })

        wrapper.appendChild(text)
        wrapper.appendChild(input)

        div.appendChild(labelEl)
        div.appendChild(wrapper)
        return div
    },

    createToggle(label: string, value: boolean, onChange: (val: boolean) => void) {
        const div = document.createElement('label')
        div.className = 'flex items-center justify-between cursor-pointer p-4 border-2 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors'

        div.innerHTML = `<span class="text-sm font-bold text-zinc-300 uppercase tracking-wide">${label}</span>`

        const wrapper = document.createElement('div')
        wrapper.className = 'relative'

        const input = document.createElement('input')
        input.type = 'checkbox'
        input.checked = value
        input.className = 'sr-only peer'

        const slider = document.createElement('div')
        slider.className = "w-12 h-7 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none peer-checked:bg-blue-600 peer-checked:border-blue-500 transition-colors relative"

        const knob = document.createElement('div')
        knob.className = "absolute top-[2px] left-[2px] bg-zinc-200 border-2 border-zinc-600 h-5 w-5 transition-transform peer-checked:translate-x-5"

        input.addEventListener('change', (e) => {
            const checked = (e.target as HTMLInputElement).checked
            onChange(checked)
            knob.style.transform = checked ? 'translateX(20px)' : 'translateX(0)'
            slider.className = checked ?
                "w-12 h-7 bg-blue-600 border-2 border-blue-500 peer-focus:outline-none transition-colors relative" :
                "w-12 h-7 bg-zinc-800 border-2 border-zinc-600 peer-focus:outline-none transition-colors relative"
        })

        if (value) {
            knob.style.transform = 'translateX(20px)'
            slider.className = "w-12 h-7 bg-blue-600 border-2 border-blue-500 peer-focus:outline-none transition-colors relative"
        }

        slider.appendChild(knob)
        wrapper.appendChild(input)
        wrapper.appendChild(slider)
        div.appendChild(wrapper)

        return div
    },

    createSelect(label: string, value: string, options: { value: string, label: string }[], onChange: (val: string) => void) {
        const div = document.createElement('div')
        div.className = 'flex flex-col gap-2'
        div.innerHTML = `<label class="text-sm font-bold text-zinc-400 uppercase tracking-wide">${label}</label>`

        const wrapper = document.createElement('div')
        wrapper.className = 'relative'

        const select = document.createElement('select')
        select.className = 'w-full bg-zinc-950 border-2 border-zinc-700 px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:shadow-[0px_0px_15px_rgba(59,130,246,0.3)] transition-all appearance-none cursor-pointer'

        options.forEach(opt => {
            const el = document.createElement('option')
            el.value = opt.value
            el.textContent = opt.label
            if (opt.value === value) el.selected = true
            select.appendChild(el)
        })

        select.addEventListener('change', (e) => onChange((e.target as HTMLSelectElement).value))

        const arrow = document.createElement('div')
        arrow.className = 'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 w-4 h-4'
        arrow.innerHTML = ICONS.chevronDown || '▼'

        wrapper.appendChild(select)
        wrapper.appendChild(arrow)
        div.appendChild(wrapper)
        return div
    }
}
