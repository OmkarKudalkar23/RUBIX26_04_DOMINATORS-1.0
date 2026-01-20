import { motion } from "motion/react";
import { X, Clock, Phone, MapPinned, Truck } from "lucide-react";

interface DeliveryTracking {
  orderId: string;
  status: "preparing" | "dispatched" | "in_transit" | "delivered";
  estimatedDelivery: string;
  driverName: string;
  driverPhone: string;
  driverLocation: {
    lat: number;
    lng: number;
  };
  progress: number;
  statusHistory: {
    status: string;
    timestamp: string;
    location: string;
  }[];
}

interface Order {
  id: string;
  items: {
    medicine: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }[];
  total: number;
  date: string;
  status: string;
}

interface DeliveryTrackingModalProps {
  delivery: DeliveryTracking;
  order: Order | undefined;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  onClose: () => void;
  formatDate: (date: string) => string;
  convertCurrency: (amount: number, currency: string) => string;
  selectedCurrency: string;
}

export function DeliveryTrackingModal({ delivery, order, deliveryAddress, onClose, formatDate, convertCurrency, selectedCurrency }: DeliveryTrackingModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl mb-1" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
              Track Delivery
            </h3>
            <p className="text-sm text-gray-600">Order #{delivery.orderId.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Tracking Info */}
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                Delivery Status
              </h4>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {delivery.status === "preparing" && "Preparing Package"}
                    {delivery.status === "dispatched" && "Package Dispatched"}
                    {delivery.status === "in_transit" && "Out for Delivery"}
                    {delivery.status === "delivered" && "Delivered"}
                  </span>
                  <span className="text-sm text-gray-600">{delivery.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black rounded-full h-2 transition-all duration-500"
                    style={{ width: `${delivery.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div>
              <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                Estimated Delivery
              </h4>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-black" />
                <div>
                  <p className="font-semibold text-black">{formatDate(delivery.estimatedDelivery)}</p>
                  <p className="text-sm text-gray-600">2-3 business days</p>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div>
              <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                Delivery Partner
              </h4>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold">
                    {delivery.driverName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{delivery.driverName}</p>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <a href={`tel:${delivery.driverPhone}`} className="text-black hover:underline">
                    {delivery.driverPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                Order Items
              </h4>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {order?.items.map((item) => (
                  <div key={item.medicine.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.medicine.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">{convertCurrency(item.medicine.price * item.quantity, selectedCurrency)}</p>
                  </div>
                ))}
                <div className="pt-3 mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{convertCurrency(order?.total || 0, selectedCurrency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div>
              <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
                Tracking History
              </h4>
              <div className="space-y-3">
                {delivery.statusHistory.map((status, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-black' : 'bg-gray-300'}`} />
                      {index !== delivery.statusHistory.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-sm">{status.status}</p>
                      <p className="text-xs text-gray-600">{status.timestamp}</p>
                      <p className="text-xs text-gray-500">{status.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div>
            <h4 className="font-semibold mb-3" style={{ fontFamily: "'Doto', sans-serif", fontWeight: "700" }}>
              Delivery Location
            </h4>
            <div className="bg-gray-100 rounded-2xl overflow-hidden h-[600px] relative">
              {/* Mock Map with Driver Location */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Driver Location Marker */}
                  <div 
                    className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white animate-pulse">
                        <Truck className="w-8 h-8" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                        {delivery.driverName}
                      </div>
                    </div>
                  </div>

                  {/* Destination Marker */}
                  <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="text-center">
                      <MapPinned className="w-12 h-12 mx-auto text-black" />
                      <div className="bg-white rounded-lg px-3 py-2 mt-2">
                        <p className="font-semibold text-sm">{deliveryAddress.street}</p>
                        <p className="text-xs text-gray-600">{deliveryAddress.city}, {deliveryAddress.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Connection Line */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1="50%"
                      y1="33%"
                      x2="50%"
                      y2="67%"
                      stroke="black"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}