interface BookRatingProps {
  rating?: number
  count?: number
  className?: string
}

export default function BookRating({ rating, count, className = '' }: BookRatingProps) {
  if (!rating && !count) {
    return null
  }

  const renderStars = () => {
    if (!rating) return null

    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      )
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ½
        </span>
      )
    }

    // Empty stars
    const totalStars = hasHalfStar ? fullStars + 1 : fullStars
    for (let i = totalStars; i < 5; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ☆
        </span>
      )
    }

    return stars
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {rating && (
        <>
          <div className="flex items-center">
            {renderStars()}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {rating.toFixed(1)}
          </span>
        </>
      )}
      {count && (
        <span className="text-sm text-gray-500">
          ({count.toLocaleString()} {count === 1 ? 'rating' : 'ratings'})
        </span>
      )}
    </div>
  )
}