export const IPL_FRANCHISES = [
  { name: 'CSK', color: '#FDB913', fullName: 'Chennai Super Kings', logo: 'https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg' },
  { name: 'RCB', color: '#EC1C24', btnTextColor: '#FFFFFF', fullName: 'Royal Challengers Bengaluru', logo: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Royal_Challengers_Bengaluru_Logo.svg' },
  { name: 'MI', color: '#004B8D', btnTextColor: '#FFFFFF', fullName: 'Mumbai Indians', logo: 'https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg' },
  { name: 'KKR', color: '#3A225D', btnTextColor: '#FFD700', fullName: 'Kolkata Knight Riders', logo: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg' },
  { name: 'DC', color: '#004CFF', btnTextColor: '#FFFFFF', fullName: 'Delhi Capitals', logo: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals.svg' },
  { name: 'RR', color: '#EA1A84', btnTextColor: '#FFFFFF', fullName: 'Rajasthan Royals', logo: 'https://upload.wikimedia.org/wikipedia/en/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg' },
  { name: 'GT', color: '#0B1936', btnTextColor: '#FFFFFF', fullName: 'Gujarat Titans', logo: 'https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg' },
  { name: 'LSG', color: '#00AEEF', btnTextColor: '#FFFFFF', fullName: 'Lucknow Super Giants', logo: 'https://upload.wikimedia.org/wikipedia/en/3/34/Lucknow_Super_Giants_Logo.svg' },
  { name: 'SRH', color: '#F58220', fullName: 'Sunrisers Hyderabad', logo: 'https://upload.wikimedia.org/wikipedia/en/5/51/Sunrisers_Hyderabad_Logo.svg' },
  { name: 'PBKS', color: '#ED1C24', btnTextColor: '#FFFFFF', fullName: 'Punjab Kings', logo: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo.svg' }
];

export const getFranchiseColor = (name) => {
  const franchise = IPL_FRANCHISES.find(f => f.name === name);
  return franchise ? franchise.color : '#4ECDC4';
};
