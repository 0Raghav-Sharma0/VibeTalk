const AuthImagePattern = ({ title, subtitle, images }) => {
    return (
      <div className="hidden lg:flex flex-1 items-center justify-center bg-base-200 p-12 rounded-3xl">
        <div className="w-full max-w-lg text-center">
          <div className="grid grid-cols-3 gap-4 mb-8 w-full">
            {images.map((imgSrc, i) => (
              <div key={i} className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={imgSrc}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-base-content/60">{subtitle}</p>
        </div>
      </div>
    );
  };
  
  export default AuthImagePattern;
  