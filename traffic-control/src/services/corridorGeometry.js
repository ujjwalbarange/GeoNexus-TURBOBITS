/**
 * Real Geographic Road Corridor Polylines for Mumbai, Nagpur, and Pune.
 * Used for vector road mapping and segment-level traffic speed / congestion overlay.
 */

export const CITY_CORRIDOR_GEOMETRIES = {
  mumbai: [
    {
      id: 'mum_weh_north',
      name: 'Western Express Highway (Bandra to Dahisar)',
      corridorCode: 'WEH',
      type: 'Expressway',
      coordinates: [
        [19.0544, 72.8402], // Bandra
        [19.0833, 72.8520], // Santacruz Airport
        [19.1136, 72.8697], // Andheri Flyover
        [19.1363, 72.8588], // Jogeshwari
        [19.1726, 72.8601], // Malad
        [19.2056, 72.8654], // Kandivali
        [19.2437, 72.8681], // Borivali
        [19.2600, 72.8720], // Dahisar Toll
      ],
      speedLimitKmH: 80,
    },
    {
      id: 'mum_eeh_north',
      name: 'Eastern Express Highway (Sion to Thane)',
      corridorCode: 'EEH',
      type: 'Expressway',
      coordinates: [
        [19.0434, 72.8633], // Sion
        [19.0650, 72.8830], // Kurla
        [19.0830, 72.9090], // Ghatkopar
        [19.1170, 72.9280], // Vikhroli
        [19.1550, 72.9460], // Bhandup
        [19.1780, 72.9570], // Mulund Toll
        [19.1980, 72.9730], // Thane Teen Hath Naka
      ],
      speedLimitKmH: 80,
    },
    {
      id: 'mum_bwsl',
      name: 'Bandra-Worli Sea Link',
      corridorCode: 'BWSL',
      type: 'Toll Bridge',
      coordinates: [
        [19.0176, 72.8150], // Worli Sea Face
        [19.0270, 72.8180], // Cable-stayed section
        [19.0400, 72.8250], // Mid-span
        [19.0490, 72.8360], // Bandra Toll Plaza
      ],
      speedLimitKmH: 80,
    },
    {
      id: 'mum_efw',
      name: 'Eastern Freeway (Orange Gate to Chembur)',
      corridorCode: 'EFW',
      type: 'Elevated Freeway',
      coordinates: [
        [18.9480, 72.8420], // Orange Gate (P D'Mello Rd)
        [18.9680, 72.8470], // Wadi Bunder
        [18.9950, 72.8550], // Cotton Green
        [19.0250, 72.8680], // Wadala Anik Depot
        [19.0550, 72.8950], // Panjarpol Chembur
      ],
      speedLimitKmH: 80,
    },
    {
      id: 'mum_sph',
      name: 'Sion-Panvel Highway (Mankhurd to Vashi Creek)',
      corridorCode: 'SPH',
      type: 'Highway',
      coordinates: [
        [19.0500, 72.9150], // Mankhurd
        [19.0620, 72.9550], // Vashi Old Bridge
        [19.0660, 72.9780], // Vashi Plaza
        [19.0430, 73.0180], // Sanpada / Nerul
      ],
      speedLimitKmH: 70,
    },
  ],
  nagpur: [
    {
      id: 'ngp_wardha_rd',
      name: 'Wardha Road (Sitabuldi to MIHAN / Airport)',
      corridorCode: 'WRD',
      type: 'Arterial',
      coordinates: [
        [21.1460, 79.0830], // Sitabuldi Interchange
        [21.1270, 79.0790], // Rahate Colony / Congress Nagar
        [21.1080, 79.0680], // Ajni Square
        [21.0850, 79.0570], // Sonegaon / Airport T-Point
        [21.0420, 79.0480], // MIHAN SEZ
      ],
      speedLimitKmH: 60,
    },
    {
      id: 'ngp_central_ave',
      name: 'Central Avenue (Dosar Vashan to Pardi Flyover)',
      corridorCode: 'CAR',
      type: 'Arterial',
      coordinates: [
        [21.1500, 79.0890], // Dosar Bhavan
        [21.1490, 79.1020], // Mayo Hospital / Agrasen Square
        [21.1470, 79.1180], // Itwari Railway crossing
        [21.1440, 79.1430], // Pardi Octroi Naka
      ],
      speedLimitKmH: 50,
    },
    {
      id: 'ngp_amravati_rd',
      name: 'Amravati Road (Variety Square to Wadi Bypass)',
      corridorCode: 'AMR',
      type: 'National Highway',
      coordinates: [
        [21.1465, 79.0770], // Variety Square
        [21.1480, 79.0540], // University Campus / Ravi Nagar
        [21.1520, 79.0300], // Bharat Nagar / Dharampeth
        [21.1580, 79.0020], // Wadi Toll Gate
      ],
      speedLimitKmH: 60,
    },
    {
      id: 'ngp_kamptee_rd',
      name: 'Kamptee Road (LIC Square to Kanhan Bridge)',
      corridorCode: 'KMP',
      type: 'Highway',
      coordinates: [
        [21.1560, 79.0860], // LIC Square
        [21.1720, 79.0960], // Gaddigodam Flyover
        [21.1950, 79.1120], // Automotive Square
        [21.2330, 79.1680], // Kamptee Cantonment
      ],
      speedLimitKmH: 60,
    },
    {
      id: 'ngp_ring_rd',
      name: 'Outer Ring Road (Mankapur to Hingna T-Point)',
      corridorCode: 'ORR',
      type: 'Ring Road',
      coordinates: [
        [21.1820, 79.0810], // Mankapur Square
        [21.1680, 79.0420], // Friends Colony
        [21.1350, 79.0250], // Ambazari Lake Bypass
        [21.1090, 79.0320], // Hingna T-Point
        [21.0920, 79.0610], // Manish Nagar
      ],
      speedLimitKmH: 70,
    },
  ],
  pune: [
    {
      id: 'pun_hinjawadi',
      name: 'Hinjawadi IT Corridor (Wakad Flyover to Phase 3)',
      corridorCode: 'HIN',
      type: 'IT Corridor',
      coordinates: [
        [18.5980, 73.7630], // Wakad Flyover / NH48
        [18.5940, 73.7420], // Hinjawadi Phase 1 Shivaji Chowk
        [18.5880, 73.7190], // Phase 2 Infosys Circle
        [18.5790, 73.6980], // Phase 3 Megapolis
      ],
      speedLimitKmH: 60,
    },
    {
      id: 'pun_nagar_rd',
      name: 'Nagar Road (Yerawada to Wagholi)',
      corridorCode: 'NGR',
      type: 'Arterial',
      coordinates: [
        [18.5520, 73.8820], // Gunjan Cinema Yerawada
        [18.5560, 73.9020], // Kalyani Nagar Junction
        [18.5620, 73.9240], // Viman Nagar Corner / Phoenix
        [18.5710, 73.9550], // Kharadi Bypass
        [18.5820, 73.9880], // Wagholi
      ],
      speedLimitKmH: 60,
    },
    {
      id: 'pun_mpe_conn',
      name: 'Mumbai-Pune Expressway Link (Nigdi to Kiwale)',
      corridorCode: 'MPE',
      type: 'Expressway Link',
      coordinates: [
        [18.6520, 73.7820], // Nigdi Pradhikaran
        [18.6650, 73.7540], // Dehu Road
        [18.6750, 73.7310], // Kiwale Toll Terminal (Expressway Start)
      ],
      speedLimitKmH: 80,
    },
    {
      id: 'pun_solapur_rd',
      name: 'Pune-Solapur Road (Swargate to Hadapsar Gadital)',
      corridorCode: 'SOL',
      type: 'Highway',
      coordinates: [
        [18.5010, 73.8580], // Swargate
        [18.5030, 73.8840], // Race Course / Pulgate
        [18.5050, 73.9110], // Fatima Nagar
        [18.5030, 73.9350], // Hadapsar Gadital
      ],
      speedLimitKmH: 50,
    },
    {
      id: 'pun_bypass',
      name: 'Katraj-Dehu Road Bypass (Chandani Chowk to Warje)',
      corridorCode: 'BYP',
      type: 'Bypass Highway',
      coordinates: [
        [18.5710, 73.7740], // Baner Highway
        [18.5130, 73.7820], // Chandani Chowk Flyover
        [18.4790, 73.8010], // Warje Bridge
        [18.4520, 73.8240], // Vadgaon Bridge
        [18.4480, 73.8560], // Katraj Tunnel
      ],
      speedLimitKmH: 70,
    },
  ],
};
