import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// Hand-drawn diagram component
function HandDrawnDiagram({ variant }: { variant: number }) {
  // Different diagram layouts for each page
  const diagrams = [
    // Diagram 1 - Simple hierarchy
    <svg className="w-full h-32 sm:h-40" viewBox="15 1 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connecting lines */}
      <path d="M 150 25 Q 150 40, 100 55" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />
      <path d="M 150 25 Q 150 40, 200 55" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />

      {/* Box 1 - top */}
      <rect x="120" y="5" width="60" height="20" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1 150 15)" />
      <line x1="125" y1="11" x2="165" y2="11" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="125" y1="16" x2="155" y2="16" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      {/* Box 2 - left */}
      <rect x="60" y="55" width="70" height="25" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1 95 67)" />
      <line x1="65" y1="63" x2="120" y2="63" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="65" y1="69" x2="110" y2="69" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="65" y1="75" x2="115" y2="75" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      {/* Box 3 - right */}
      <rect x="170" y="55" width="70" height="25" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1.5 205 67)" />
      <line x1="175" y1="63" x2="230" y2="63" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="175" y1="69" x2="220" y2="69" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
    </svg>,

    // Diagram 2 - Web/network
    <svg className="w-full h-32 sm:h-40" viewBox="5 10 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connecting lines - web pattern */}
      <path d="M 60 40 L 150 30" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="3,2" />
      <path d="M 60 40 L 100 85" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="3,2" />
      <path d="M 150 30 L 240 50" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="3,2" />
      <path d="M 150 30 L 200 85" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="3,2" />
      <path d="M 100 85 L 200 85" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="3,2" />

      {/* Boxes */}
      <rect x="30" y="25" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(2 60 40)" />
      <line x1="35" y1="35" x2="80" y2="35" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="35" y1="42" x2="75" y2="42" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="120" y="15" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1 150 30)" />
      <line x1="125" y1="25" x2="170" y2="25" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="125" y1="32" x2="165" y2="32" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="210" y="35" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1.5 240 50)" />
      <line x1="215" y1="45" x2="260" y2="45" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="70" y="70" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-2 100 85)" />
      <line x1="75" y1="80" x2="120" y2="80" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="75" y1="87" x2="110" y2="87" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="170" y="70" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1 200 85)" />
      <line x1="175" y1="80" x2="220" y2="80" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
    </svg>,

    // Diagram 3 - Flow
    <svg className="w-full h-32 sm:h-40" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flow arrows */}
      <path d="M 75 40 L 115 40" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <path d="M 185 40 L 225 40" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
      <path d="M 150 55 L 150 75" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />

      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="oklch(0.25 0.02 45)" />
        </marker>
      </defs>

      {/* Boxes */}
      <rect x="20" y="25" width="55" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1 47 40)" />
      <line x1="25" y1="35" x2="65" y2="35" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="120" y="25" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1 150 40)" />
      <line x1="125" y1="35" x2="170" y2="35" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="125" y1="42" x2="165" y2="42" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="230" y="25" width="55" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1.5 257 40)" />
      <line x1="235" y1="35" x2="275" y2="35" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="120" y="80" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1 150 95)" />
      <line x1="125" y1="90" x2="170" y2="90" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="125" y1="97" x2="160" y2="97" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
    </svg>,

    // Diagram 4 - Mind map
    <svg className="w-full h-32 sm:h-40" viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Curved connecting lines */}
      <path d="M 150 50 Q 120 35, 90 35" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />
      <path d="M 150 50 Q 180 35, 210 35" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />
      <path d="M 150 50 Q 120 75, 90 90" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />
      <path d="M 150 50 Q 180 75, 210 90" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" strokeDasharray="2,2" />

      {/* Center circle */}
      <circle cx="150" cy="50" r="25" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5" transform="rotate(2 150 50)" />
      <line x1="135" y1="45" x2="165" y2="45" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
      <line x1="135" y1="52" x2="160" y2="52" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      {/* Outer boxes */}
      <rect x="60" y="20" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-2 90 35)" />
      <line x1="65" y1="30" x2="110" y2="30" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="180" y="20" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1.5 210 35)" />
      <line x1="185" y1="30" x2="230" y2="30" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="60" y="75" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(1 90 90)" />
      <line x1="65" y1="85" x2="110" y2="85" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />

      <rect x="180" y="75" width="60" height="30" fill="none" stroke="oklch(0.25 0.02 45)" strokeWidth="1.5"
        rx="2" transform="rotate(-1.5 210 90)" />
      <line x1="185" y1="85" x2="230" y2="85" stroke="oklch(0.25 0.02 45)" strokeWidth="0.8" opacity="0.6" />
    </svg>,
  ]

  return (
    <div className="mt-6 sm:mt-8 opacity-80">
      {diagrams[variant]}
    </div>
  )
}

// BookPage component for interior pages
interface BookPageProps {
  title: string
  content: string
  marginNote: string
  highlightColor: string
  isLast?: boolean
  pageIndex?: number
}

function BookPage({ title, content, marginNote, highlightColor, isLast, pageIndex }: BookPageProps) {
  return (
    <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
      {/* Front side of page */}
      <div
        className="absolute inset-0 p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden bg-card flex flex-col"
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* Book text content */}
        <div className="text-foreground space-y-4 sm:space-y-6 flex-shrink-0">
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

        {/* Hand-drawn diagram at bottom */}
        <div className="flex-grow flex items-end">
          <HandDrawnDiagram variant={pageIndex || 0} />
        </div>

        {/* Handwritten margin note */}
        <div
          className="absolute right-3 top-1/4 max-w-[120px] sm:max-w-[160px] md:max-w-[200px]"
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

      {/* Back side of page (opaque, prevents text show-through) */}
      <div
        className="absolute inset-0 bg-card border-2 border-border"
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
                  pageIndex={0}
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
                  pageIndex={1}
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
                  pageIndex={2}
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
                  pageIndex={3}
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
