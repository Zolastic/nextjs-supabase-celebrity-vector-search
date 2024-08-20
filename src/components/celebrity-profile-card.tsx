import Image from "next/image";
import React from "react";

type CelebrityProfileCardProps = {
  profile: CelebrityProfile;
};

const CelebrityProfileCard = ({ profile }: CelebrityProfileCardProps) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-md m-4 h-full w-full">
      <Image
        src={profile.image}
        alt={profile.first_name}
        width={256}
        height={256}
        className="w-full h-64 object-contain"
      />
      <div className="px-6 py-4 text-slate-800">
        <div className="font-bold text-xl mb-2">{`${profile.first_name} ${profile.last_name}`}</div>
        <p>{`Age: ${profile.age}`}</p>
      </div>
    </div>
  );
};

export default CelebrityProfileCard;
