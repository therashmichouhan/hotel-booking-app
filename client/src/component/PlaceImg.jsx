import Image from "../component/Image";

export default function PlaceImg({ place, index = 0, className = null }) {
  if (!place.photos?.length) {
    return "";
  }

  if (!className) {
    className = "object-cover w-full  h-full";
  }

  return <Image className={className} src={place.photos[index]} alt='' />;
}
