import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LinkAddress from "../LinkAddress";
import PlaceGallery from "../PlaceGallery";
import BookingDates from "../component/BookingDates";

export default function BookingPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (id) {
      axios.get("/bookings").then((response) => {
        const foundBooking = response.data.find(({ _id }) => _id === id);
        if (foundBooking) {
          setBooking(foundBooking);
        }
      });
    }
  }, [id]);

  if (!booking) {
    return "";
  }
  return (
    <div className='my-4'>
      <h1 className='text-3xl'>{booking.place.title}</h1>
      <LinkAddress className='my-2 block'>{booking.place.address}</LinkAddress>
      <div className='bg-gray-200 p-6 my-6 rounded-xl flex items-center justify-between'>
        <div>
          <h2 className='text-2xl mb-4'>Your Booking Information:</h2>
          <BookingDates booking={booking} />
        </div>
        <div className='bg-primary p-6 text-white rounded-xl'>
          <div>Total Price</div>
          <div className='text-3xl'>${booking.price}</div>
        </div>
      </div>
      <PlaceGallery place={booking.place} />
    </div>
  );
}
