/** Soft corner accent for photo & intro sections. */
export default function DecorativeAccent({
  src,
  position = 'top-right',
  size = 'md',
  opacity = 0.72,
  rotate = 0,
  flipX = false,
  className = '',
}) {
  const sizes = {
    sm: 'w-[110px] sm:w-[130px] md:w-[150px]',
    md: 'w-[150px] sm:w-[180px] md:w-[210px] lg:w-[240px]',
    lg: 'w-[180px] sm:w-[220px] md:w-[260px] lg:w-[300px]',
    xl: 'w-[210px] sm:w-[250px] md:w-[300px] lg:w-[360px]',
  };

  const positions = {
    'top-right': 'absolute top-2 right-0 sm:top-4 sm:right-2',
    'top-left': 'absolute top-2 left-0 sm:top-4 sm:left-2',
    'bottom-right': 'absolute bottom-2 right-0 sm:bottom-4 sm:right-2',
    'bottom-left': 'absolute bottom-2 left-0 sm:bottom-4 sm:left-2',
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`pointer-events-none select-none ${positions[position] || positions['top-right']} ${sizes[size] || sizes.md} ${className}`}
      style={{
        zIndex: 0,
        opacity,
        transform: `rotate(${rotate}deg)${flipX ? ' scaleX(-1)' : ''}`,
      }}
    />
  );
}
