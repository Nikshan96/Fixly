const jobs = [
  {
    _id: "job_1",
    title: "Panidhara Marmat",
    type: "Plumbing",
    description: "Kitchen ko dhara bata pani chuhiyeko cha.",
    price: 850,
    location: { address: "Kalanki, Kathmandu", city: "Kathmandu", ward: "14" },
    status: "pending",
    customer: { _id: "cust_1", name: "Sita Sharma", phone: "9841234567", avatar: "https://i.pravatar.cc/150?u=sita" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "job_2",
    title: "Bijuli Switch Change",
    type: "Electrical",
    description: "Baithak kotha ko switch change garnu parne.",
    price: 1200,
    location: { address: "Pulchowk, Lalitpur", city: "Lalitpur", ward: "3" },
    status: "pending",
    customer: { _id: "cust_2", name: "Ram Bahadur", phone: "9851012345", avatar: "https://i.pravatar.cc/150?u=ram" },
    createdAt: new Date().toISOString()
  },
  {
    _id: "job_3",
    title: "Pankha Jodan",
    type: "Electrical",
    description: "Purano light nikalera pankha jodan garnu parne.",
    price: 1500,
    location: { address: "Baneshwor, Kathmandu", city: "Kathmandu", ward: "10" },
    status: "accepted",
    technician: "60d0fe4f5311236168a109ca", // Matches our dev user ID
    customer: { _id: "cust_3", name: "Hari Krishna", phone: "9801234567", avatar: "https://i.pravatar.cc/150?u=hari", address: "Baneshwor, Kathmandu" },
    acceptedAt: new Date().toISOString()
  },
  {
    _id: "job_4",
    title: "Bhitta Rangaudai",
    type: "Painting",
    description: "Corridor ma sano pwal talne ani rang lagaune.",
    price: 950,
    location: { address: "Suryabinayak, Bhaktapur", city: "Bhaktapur", ward: "5" },
    status: "completed",
    technician: "60d0fe4f5311236168a109ca",
    customer: { _id: "cust_4", name: "Gita Thapa", phone: "9812345678", avatar: "https://i.pravatar.cc/150?u=gita" },
    completedAt: new Date().toISOString()
  }
];

const messages = [
  {
    _id: "msg_1",
    conversationId: "job_job_3",
    sender: { _id: "cust_3", name: "Hari Krishna", avatar: "https://i.pravatar.cc/150?u=hari" },
    text: "Namaste, tapai sanga bharyang cha ki chaina?",
    createdAt: new Date(Date.now() - 100000).toISOString(),
    readBy: ["60d0fe4f5311236168a109ca"]
  },
  {
    _id: "msg_2",
    conversationId: "job_job_3",
    sender: { _id: "60d0fe4f5311236168a109ca", name: "Test User", avatar: "https://i.pravatar.cc/150?u=fake" }, 
    text: "Hajur namaste, ma sanga 6ft ko bharyang cha. Ceiling tyo bhanda aglo cha?",
    createdAt: new Date(Date.now() - 50000).toISOString(),
    readBy: ["cust_3"]
  }
];

const notifications = [
  {
    _id: "notif_1",
    recipient: "60d0fe4f5311236168a109ca",
    title: "Naya Kaam Aayo",
    message: "'Panidhara Marmat' ko lagi naya kaam aako cha.",
    type: "job_new",
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: "notif_2",
    recipient: "60d0fe4f5311236168a109ca",
    title: "Hari ko message",
    message: "Namaste, tapai sanga bharyang cha ki chaina?",
    type: "chat_message",
    read: true,
    createdAt: new Date().toISOString()
  }
];

const mockUser = {
    _id: "60d0fe4f5311236168a109ca",
    name: "Test User",
    email: "test@example.com",
    role: "technician", 
    phone: "9841000000",
    address: "Kathmandu, Nepal",
    location: { type: "Point", coordinates: [85.3240, 27.7172] },
    password: "password123", // For mock auth
    isActive: true
};

module.exports = { jobs, messages, notifications, mockUser };