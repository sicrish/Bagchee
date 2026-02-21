import React from 'react';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/images/common/logo.png';

const LogoBlue = ({ className = '' }) => {
  return (
    <Link to="/" className="flex items-center group gap-2">
    <div className="flex items-center group gap-2">
         <div className="relative">
           <div className="absolute inset-0 bg-primary rounded-lg opacity-90"></div>
           <img
             src={logoImg}
             alt="Bagchee Icon"
             className="relative h-10 md:h-12 w-auto object-contain p-1"
           />
         </div>
   
          <div className="flex flex-col leading-none">
            <span className="text-xl md:text-2xl tracking-[0.2em] text-black uppercase font-bold">
              Bagchee
            </span>
            <div className="h-[1px] bg-white/80 my-0.5 w-full"></div> {/* White line */}
            <span className="text-[8px] md:text-[10px] tracking-[0.4em] text-black/80 uppercase font-medium">
              Books That Stick
            </span>
          </div>
       </div>
    </Link>
  );
};

export default memo(LogoBlue);
