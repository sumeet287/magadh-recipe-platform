import { WHY_CHOOSE_US, BRAND_STORY } from "@/lib/constants";

export function WhyChooseUs() {
  return (
    <section className="py-20 md:py-28 bg-[#0f0805] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-turmeric-500/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #D4843A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Why Magadh Recipe
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
            The{" "}
            <span className="bg-gradient-to-r from-brand-400 to-turmeric-300 bg-clip-text text-transparent">Magadh</span>{" "}
            Difference
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-base">
            Our commitment to authenticity and quality sets us apart from every other pickle brand.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {WHY_CHOOSE_US.map((item, idx) => (
            <div
              key={item.title}
              className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-brand-500/30 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/0 group-hover:from-brand-500/5 to-transparent transition-all duration-500" />

              {/* Icon */}
              <div className="relative text-4xl mb-5 transform group-hover:scale-110 transition-transform duration-300 w-fit">
                {item.icon}
              </div>

              <h3 className="relative font-serif font-bold text-white text-xl mb-3">
                {item.title}
              </h3>
              <p className="relative text-white/50 text-sm leading-relaxed">{item.body}</p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-brand-500/0 group-hover:via-brand-500/40 to-transparent transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStory() {
  return (
    <section className="relative overflow-hidden bg-[#faf7f2] py-20 md:py-28">
      {/* Large decorative background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-serif font-bold text-brand-500/[0.04] select-none whitespace-nowrap">
          Bihar
        </span>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Story image collage */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden h-[420px] md:h-[520px] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85"
                alt="Bihar traditional kitchen"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e07]/60 to-transparent" />
              {/* Floating stat cards */}
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                {BRAND_STORY.stats.slice(0, 2).map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-brand-300 font-serif leading-none">{stat.value}</div>
                    <div className="text-[11px] text-white/60 mt-1 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Small accent card */}
            <div className="absolute -right-4 top-10 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 hidden lg:flex">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-2xl">🏺</div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Est.</p>
                <p className="text-xl font-serif font-bold text-earth-dark">2018</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <p className="text-brand-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              Our Story
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0e07] mb-3 leading-tight">
              {BRAND_STORY.title}
            </h2>
            <p className="text-brand-500 font-medium text-lg mb-8">{BRAND_STORY.subtitle}</p>

            <div className="space-y-5 mb-10">
              {BRAND_STORY.paragraphs.map((p, idx) => (
                <p key={idx} className="text-gray-600 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              {BRAND_STORY.stats.slice(2).map((stat) => (
                <div
                  key={stat.label}
                  className="bg-brand-50 border border-brand-100 rounded-2xl p-5"
                >
                  <div className="text-3xl font-bold text-brand-600 font-serif mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
