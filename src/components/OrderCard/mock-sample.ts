// Apps TODO:
// - Change leaflet to google maps library -> use provided key

// - Only on driver login or when opening the app, use speeddash repo GET API request /api/work-status (New todos commented in code base inside drivers.api.ts and WorkStatusToggle.tsx files)
// - Check toggle functionality

// - Partner app create order -> use speeddash-backend repo API
// 	- see sampleCreateOrder for API payload

// - Driver notification response result -> see sampleDriverNotification -> if type==='NEW_ORDER_OFFER' show the accept/reject buttons, if type==='FORCE_ASSIGNED_ORDER' do not show accept/reject buttons

// - After driver receives notification, use speeddash-backend repo API /orders/accept
// 	- see sampleAcceptOrder for API payload

// get order api result sample:
// if any errors were encountered, it would be preferable to use JSON.parse(JSON.stringify(order)) to get a proper copy of the order object
const sampleGetOrders = [
  {
    _id: '6a6b8e71f88debcaa4c87050',
    customerPhoneNumber: '53',
    driverId: {
      _id: '6a63aef3add566fc8cd0eac3',
      role: 'driver',
      firstName: 'mhmd',
      lastName: 'cc',
      phoneNumber: '',
    },
    partnerId: {
      _id: '6a639e00add566fc8cd0eac2',
      role: 'partner',
      businessName: 'Shawarma',
      phoneNumber: '',
    },
    deliveryFee: {
      $numberDecimal: '1',
    },
    pickupLocation: {
      coordinates: [33.782004, 35.479479],
    },
    dropoffLocation: {
      coordinates: [33.785468, 35.490001],
      googlePlaceId: '',
      description: '',
    },
    status: 'ASSIGNED',
    assignedAt: 1785433745,
    deliveredAt: null,
    ignoredAccepting: ['6a65475e131aeb9932e50efd'],
    rejectedAccepting: [],
    note: 'aoihfiurvbs laerriu galeru aer bagr ibaeir uebw',
    createdAt: '2026-07-30T17:48:33.561Z',
    updatedAt: '2026-07-30T17:49:05.828Z',
    __v: 0,
  },
];

// partner app
const sampleCreateOrder = {
  customerPhoneNumber: '',
  partnerId: '',
  note: '',
  deliveryFee: '',
  dropoffLocation: {
    coordinates: [0, 0], // [lat, lng]
    description: '', // partner can send either description or coordinates
    googlePlaceId: '', // do not use
  },
};

// partner app
const sampleAcceptOrder = {
  orderId: '',
  driverId: '',
  accepted: true || false,
};

const isForced = true;
const sampleDriverNotification = {
  orderId: '<ORDER_ID>',
  message: isForced
    ? 'You have been forcefully assigned an escalated order.'
    : 'New pickup request near your location.',
  type: isForced ? 'FORCE_ASSIGNED_ORDER' : 'NEW_ORDER_OFFER',
  timeout: 30,
  deliveryFee: { $numberDecimal: '3.5' },
  note: '',
  customerPhoneNumber: '',
  createdAt: '2026-07-30T17:48:33.561Z',
  partnerId: {
    _id: '',
    businessName: '',
  },
  pickupLocation: {
    coordinates: [0, 0], // [lat, lng]
    description: '', // partner can send either description or coordinates
    googlePlaceId: '', // do not use
  },
  dropoffLocation: {
    coordinates: [0, 0], // [lat, lng]
    description: '', // partner can send either description or coordinates
    googlePlaceId: '', // do not use
  },
};
