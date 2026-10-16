function BrandName({ className = "" }) {
  return (
    <span className={`brand-name ${className}`.trim()} aria-label="Digital Nivaran">
      <span>Digital</span>
      <strong>Nivaran</strong>
    </span>
  )
}

export default BrandName
