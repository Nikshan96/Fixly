import { getInitials } from "../utils/helpers";
const SIZES = { xs:"w-7 h-7 text-[10px]", sm:"w-10 h-10 text-sm", md:"w-14 h-14 text-lg", lg:"w-20 h-20 text-2xl" };
export default function Avatar({ user, size="sm", onClick, className="" }) {
  return (
    <div onClick={onClick} className={`rounded-full bg-btn-orange flex items-center justify-center font-extrabold text-white border-2 border-orange/50 overflow-hidden flex-shrink-0 ${SIZES[size]} ${onClick?"cursor-pointer":""} ${className}`}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"/>
        : getInitials(user?.name)}
    </div>
  );
}
