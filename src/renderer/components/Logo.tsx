import React from "react"

interface LogoProps {
  size?: number
  className?: string
}

// The logo is located at /assets/Pulselogo.png (512x512)
// In Electron, we need to use a path relative to the app
export function Logo({ size = 48, className = "" }: LogoProps) {
  // For Electron, we use a file:// path or require the image
  // The logo will be copied to dist during build
  const logoSrc = "../../../assets/Pulselogo.png"

  return (
    <img
      src={logoSrc}
      alt="Pulse Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        // Fallback to gradient if image fails to load
        const target = e.target as HTMLImageElement
        target.style.display = "none"
        const parent = target.parentElement
        if (parent) {
          const fallback = document.createElement("div")
          fallback.className = `flex items-center justify-center text-white font-bold rounded-xl`
          fallback.style.width = `${size}px`
          fallback.style.height = `${size}px`
          fallback.style.background = "linear-gradient(135deg, #6366f1, #8b5cf6)"
          fallback.style.fontSize = `${size * 0.4}px`
          fallback.textContent = "P"
          parent.appendChild(fallback)
        }
      }}
    />
  )
}

// Logo with gradient background container
export function LogoWithBackground({
  size = 48,
  className = "",
  rounded = "xl"
}: LogoProps & { rounded?: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        boxShadow: "0 4px 20px -4px rgba(99, 102, 241, 0.4)",
      }}
    >
      <Logo size={size * 0.8} />
    </div>
  )
}
