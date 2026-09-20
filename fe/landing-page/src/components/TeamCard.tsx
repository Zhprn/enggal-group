import React from 'react';

interface TeamCardProps {
  id?: number | string;
  name: string;
  position: string;
  image: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}

const TeamCard: React.FC<TeamCardProps> = ({
  name,
  position,
  image,
  linkedinUrl,
  instagramUrl
}) => {
  // Ensure URLs are absolute
  const getAbsoluteUrl = (url: string | undefined) => {
    if (!url) return undefined;

    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // If it's a relative URL, make it absolute by adding https://
    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `https://${cleanUrl}`;
  };

  const absoluteLinkedinUrl = getAbsoluteUrl(linkedinUrl);
  const absoluteInstagramUrl = getAbsoluteUrl(instagramUrl);

  return (
    <div className="bg-white rounded-xl overflow-hidden max-w-sm mx-auto relative">
      <div className="absolute inset-0  pointer-events-none w-full bg-[url('/images/dots.png')] bg-center bg-cover opacity-80"></div>
      {/* Colorful header bar */}
      <div className="flex h-2 w-1/2 relative z-10">
        <div className="h-full w-1/3 bg-[#9C0000]" />
        <div className="h-full w-1/3 bg-[#FFB835]" />
        <div className="h-full w-1/3 bg-[#6E0112]" />
      </div>

      {/* Profile image */}
      <div className="px-6 pt-8">
        <div className="w-[300px] mx-auto overflow-hidden z-10 relative">
          <img
            src={image}
            alt={name}
            className="w-full h-40 object-contain object-center mx-auto"
          />
        </div>
      </div>

      {/* Name and position section */}
      <div className="">
        <div className="bg-[#FFB835] rounded-lg p-4 text-white relative flex justify-between">
          <div>
            <h3 className="font-jakarta font-bold text-xl mb-1">{name}</h3>
            <p className="font-jakarta font-medium text-sm opacity-90">{position}</p>
          </div>

          {/* Social media icons */}
          <div className="flex gap-2 mt-3">
            {absoluteLinkedinUrl && (
              <a
                href={absoluteLinkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-[#A71D28] hover:text-white text-[#A71D28] p-2 rounded-md transition-colors flex items-center justify-center w-10 h-10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
            )}

            {absoluteInstagramUrl && (
              <a
                href={absoluteInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-[#A71D28] hover:text-white text-[#A71D28] p-2 rounded-md transition-colors flex items-center justify-center w-10 h-10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;