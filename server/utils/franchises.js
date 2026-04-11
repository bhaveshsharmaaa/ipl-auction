export const IPL_FRANCHISES = [
  { name: 'CSK', color: '#FDB913', fullName: 'Chennai Super Kings' },
  { name: 'RCB', color: '#2B2A29', fullName: 'Royal Challengers Bengaluru' },
  { name: 'MI', color: '#004BA0', fullName: 'Mumbai Indians' },
  { name: 'KKR', color: '#3A225D', fullName: 'Kolkata Knight Riders' },
  { name: 'DC', color: '#00008B', fullName: 'Delhi Capitals' },
  { name: 'RR', color: '#EA1B85', fullName: 'Rajasthan Royals' },
  { name: 'GT', color: '#1B2133', fullName: 'Gujarat Titans' },
  { name: 'LSG', color: '#0057E7', fullName: 'Lucknow Super Giants' },
  { name: 'SRH', color: '#FF822A', fullName: 'Sunrisers Hyderabad' },
  { name: 'PBKS', color: '#ED1B24', fullName: 'Punjab Kings' }
];

export const getFranchiseColor = (name) => {
  const franchise = IPL_FRANCHISES.find(f => f.name === name);
  return franchise ? franchise.color : '#4ECDC4';
};
