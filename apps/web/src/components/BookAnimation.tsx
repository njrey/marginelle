import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// BookPage component for interior pages
interface BookPageProps {
  title: string
  content: string
  marginNote: string
  highlightColor: string
  isLast?: boolean
}

function BookPage({ title, content, marginNote, highlightColor, isLast }: BookPageProps) {
  return (
    <div className="relative w-full h-full">
      {/* Front side of page */}
      <div
        className="absolute inset-0 p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden"
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* Book text content */}
        <div className="text-foreground space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-6">
            {title}
          </h2>

          {/* Sample book text with highlight */}
          <p className="text-sm sm:text-base md:text-lg leading-relaxed font-serif">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.{' '}
            <span
              className="px-1"
              style={{
                background: `linear-gradient(120deg, ${highlightColor}00 0%, ${highlightColor}FF 50%, ${highlightColor}00 100%)`,
              }}
            >
              {content}
            </span>{' '}
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>

          <p className="text-sm sm:text-base md:text-lg leading-relaxed font-serif">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
            proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>

          {isLast && (
            <div className="pt-8">
              <a
                href="/books/list"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-md text-sm sm:text-base"
              >
                Get Started
              </a>
            </div>
          )}
        </div>

        {/* Handwritten margin note */}
        <div
          className="absolute right-2 top-1/3 max-w-[120px] sm:max-w-[160px] md:max-w-[200px]"
          style={{
            transform: 'rotate(-2deg)',
            fontFamily: 'Caveat, cursive',
          }}
        >
          <p className="text-base sm:text-lg md:text-xl text-primary leading-tight">
            {marginNote}
          </p>
          {/* Arrow pointing to highlighted text */}
          <svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-primary mt-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 17L17 7M17 7H8M17 7V16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Back side of page (reversed) */}
      <div
        className="absolute inset-0 bg-card"
        style={{
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  )
}

// Page content data
const pages = [
  {
    id: 'introduction',
    title: 'Introduction',
    color: '#FEF08A', // yellow
    content: 'Welcome to a new way of reading',
    marginNote: 'Start your journey here!',
  },
  {
    id: 'notes',
    title: 'Notes',
    color: '#FBCFE8', // pink
    content: 'Capture insights as you read',
    marginNote: 'Never forget an idea',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    color: '#BBF7D0', // green
    content: 'Connect ideas across books',
    marginNote: 'Build your knowledge graph',
  },
  {
    id: 'progress',
    title: 'Progress',
    color: '#BFDBFE', // blue
    content: 'Track your reading journey',
    marginNote: 'See how far you\'ve come',
  },
]

export function BookAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track scroll progress within the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Map scroll progress to initial book opening (first 20%)
  const coverRotation = useTransform(scrollYProgress, [0, 0.2], [0, -175])

  // Individual page rotations (each page gets 20% of scroll)
  const page1Rotation = useTransform(scrollYProgress, [0.2, 0.4], [0, -175])
  const page2Rotation = useTransform(scrollYProgress, [0.4, 0.6], [0, -175])
  const page3Rotation = useTransform(scrollYProgress, [0.6, 0.8], [0, -175])
  const page4Rotation = useTransform(scrollYProgress, [0.8, 1], [0, -175])

  // Slide book to right as it opens to keep it centered
  const bookTranslateX = useTransform(scrollYProgress, [0, 0.2], ['0%', '25%'])

  // Post-it visibility - peek out when closed (partially hidden), fully visible when open
  //const postItTranslateY = useTransform(scrollYProgress, [.5, 0.2], [-20, 10])

  // Fade out spine as book opens
  const spineOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Fade out scroll indicator as user starts scrolling
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0])

  // Function to scroll to a specific section
  const scrollToSection = (pageIndex: number) => {
    // Each section is 20% of the total scroll
    const targetProgress = (pageIndex + 1) * 0.2
    const scrollHeight = containerRef.current?.scrollHeight || 0
    const viewportHeight = window.innerHeight
    const scrollDistance = (scrollHeight - viewportHeight) * targetProgress

    window.scrollTo({
      top: scrollDistance + (containerRef.current?.offsetTop || 0),
      behavior: 'smooth',
    })
  }

  return (
    <div ref={containerRef} className="relative bg-background" style={{ height: '500vh' }}>
      {/* Sticky book container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-visible">
        {/* Book Container */}
        <motion.div
          className="relative"
          style={{
            perspective: '2000px',
            x: bookTranslateX,
          }}
        >
          {/* Post-it note navigation - attached to top edge of book */}
          <motion.div
            className="absolute -top-10 left-1/4 right-1/4 flex flex-row justify-around gap-1 sm:gap-2"
            style={{
              //y: postItTranslateY,
            }}
          >
            {pages.map((page, index) => (
              <motion.button
                key={page.id}
                onClick={() => scrollToSection(index)}
                className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                style={{
                  backgroundColor: page.color,
                  color: '#1F2937',
                  transform: `rotate(${-2 + index}deg)`,
                  transformOrigin: 'bottom center',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '40px',
                  textAlign: 'center',
                }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                {page.title}
              </motion.button>
            ))}
          </motion.div>
          <div
            className="relative w-80 h-96 sm:w-96 sm:h-[32rem] md:w-[32rem] md:h-[40rem] lg:w-[40rem] lg:h-[48rem]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Book with 3D depth */}
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Page stack edges - bottom */}
              <div
                className="absolute left-0 right-0 bottom-0 h-6 sm:h-8"
                style={{
                  background: 'repeating-linear-gradient(to right, oklch(0.95 0.01 70) 0px, oklch(0.92 0.015 68) 1px, oklch(0.95 0.01 70) 2px)',
                  transform: 'rotateX(-90deg)',
                  transformOrigin: 'bottom center',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
                }}
              />

              {/* Page stack edges - top */}
              <div
                className="absolute left-0 right-0 top-0 h-6 sm:h-8"
                style={{
                  background: 'repeating-linear-gradient(to right, oklch(0.95 0.01 70) 0px, oklch(0.92 0.015 68) 1px, oklch(0.95 0.01 70) 2px)',
                  transform: 'rotateX(90deg)',
                  transformOrigin: 'top center',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                }}
              />

              {/* Page stack edges - right (visible when closed) */}
              <div
                className="absolute top-0 bottom-0 right-0 w-6 sm:w-8"
                style={{
                  background: 'repeating-linear-gradient(to bottom, oklch(0.95 0.01 70) 0px, oklch(0.92 0.015 68) 1px, oklch(0.95 0.01 70) 2px)',
                  transform: 'rotateY(90deg)',
                  transformOrigin: 'right center',
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.1)',
                }}
              />

              {/* Back Cover (always visible on left) */}
              <div
                className="absolute inset-0 rounded-l-lg border-2 border-primary"
                style={{
                  background: 'linear-gradient(to right, oklch(0.40 0.08 45), oklch(0.45 0.08 45))',
                  transform: 'translateZ(4px)',
                  transformOrigin: 'right center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {/* Spine shadow */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-4"
                  style={{
                    background: 'linear-gradient(to left, rgba(0,0,0,0.3), transparent)',
                  }}
                />
              </div>

              {/* Front Cover (flips first) */}
              <motion.div
                className="absolute inset-0 rounded-r-lg border-2 border-primary"
                style={{
                  background: 'linear-gradient(to left, oklch(0.45 0.08 45), oklch(0.50 0.08 45))',
                  rotateY: coverRotation,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  translateZ: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {/* Front cover design */}
                <div className="relative w-full h-full p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-primary-foreground">
                  <div
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center mb-4"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    Marginelle
                  </div>
                  <div className="w-20 sm:w-24 md:w-32 h-1 bg-accent mb-4 rounded" />
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-serif text-center opacity-90">
                    Your Reading
                    <br />
                    Companion
                  </div>
                </div>

                {/* Inner side of front cover */}
                <div
                  className="absolute inset-0 rounded-r-lg bg-card border-2 border-primary"
                  style={{
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                  }}
                />
              </motion.div>

              {/* Page 1 - Introduction */}
              <motion.div
                className="absolute inset-0 bg-card border-2 border-border"
                style={{
                  rotateY: page1Rotation,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  translateZ: 16,
                }}
              >
                <BookPage
                  title={pages[0].title}
                  content={pages[0].content}
                  marginNote={pages[0].marginNote}
                  highlightColor={pages[0].color}
                />
              </motion.div>

              {/* Page 2 - Notes */}
              <motion.div
                className="absolute inset-0 bg-card border-2 border-border"
                style={{
                  rotateY: page2Rotation,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  translateZ: 12,
                }}
              >
                <BookPage
                  title={pages[1].title}
                  content={pages[1].content}
                  marginNote={pages[1].marginNote}
                  highlightColor={pages[1].color}
                />
              </motion.div>

              {/* Page 3 - Relationships */}
              <motion.div
                className="absolute inset-0 bg-card border-2 border-border"
                style={{
                  rotateY: page3Rotation,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  translateZ: 8,
                }}
              >
                <BookPage
                  title={pages[2].title}
                  content={pages[2].content}
                  marginNote={pages[2].marginNote}
                  highlightColor={pages[2].color}
                />
              </motion.div>

              {/* Page 4 - Progress */}
              <motion.div
                className="absolute inset-0 bg-card border-2 border-border"
                style={{
                  rotateY: page4Rotation,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  translateZ: 4,
                }}
              >
                <BookPage
                  title={pages[3].title}
                  content={pages[3].content}
                  marginNote={pages[3].marginNote}
                  highlightColor={pages[3].color}
                  isLast={true}
                />
              </motion.div>

              {/* Book spine - left side */}
              <motion.div
                className="absolute top-2 bottom-5.5 -left-6 w-16 sm:w-20 md:w-24 lg:w-28 border-y-2 border-primary rounded-l-lg"
                style={{
                  transform: 'rotateY(-70deg) skewY(5deg)',
                  transformOrigin: 'left center',
                  background: 'linear-gradient(to right, oklch(0.32 0.08 45), oklch(0.42 0.08 45) 50%, oklch(0.32 0.08 45))',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                  opacity: spineOpacity,
                }}
              >
                {/* Spine title */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                  }}
                >
                  <span className="text-primary-foreground font-serif font-bold text-sm sm:text-base md:text-lg lg:text-xl opacity-90" style={{ letterSpacing: '0.1em' }}>
                    MARGINELLE
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 sm:bottom-12 flex flex-col items-center gap-2"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <p className="text-sm sm:text-base text-muted-foreground font-medium">Scroll to begin</p>
          <motion.svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.div>
      </div>
    </div>
  )
}
