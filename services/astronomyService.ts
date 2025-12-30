import * as Astronomy from 'astronomy-engine';

export interface PlanetaryPosition {
    body: string;
    sign: string;
    retrograde: boolean;
    degree: number;
}

const SIGNS = [
    "Áries", "Touro", "Gêmeos", "Câncer", 
    "Leão", "Virgem", "Libra", "Escorpião", 
    "Sagitário", "Capricórnio", "Aquário", "Peixes"
];

// Returns current sky state
export const getCurrentEphemeris = (): PlanetaryPosition[] => {
    const date = new Date();
    const bodies = [
        { name: 'Sol', body: Astronomy.Body.Sun },
        { name: 'Lua', body: Astronomy.Body.Moon },
        { name: 'Mercúrio', body: Astronomy.Body.Mercury },
        { name: 'Vênus', body: Astronomy.Body.Venus },
        { name: 'Marte', body: Astronomy.Body.Mars },
        { name: 'Júpiter', body: Astronomy.Body.Jupiter },
        { name: 'Saturno', body: Astronomy.Body.Saturn },
    ];

    return bodies.map(b => {
        const equator = Astronomy.Equator(b.body, date, Astronomy.Observer.Doppler, false, true);
        const ecliptic = Astronomy.Ecliptic(equator);
        
        // Ecliptic longitude determines zodiac sign (0 = 0 Aries)
        const longitude = ecliptic.elon; 
        const signIndex = Math.floor(longitude / 30);
        const degree = Math.floor(longitude % 30);
        
        // Check retrograde (compare with 1 hour ago)
        const datePrev = new Date(date.getTime() - 3600000);
        const equatorPrev = Astronomy.Equator(b.body, datePrev, Astronomy.Observer.Doppler, false, true);
        const eclipticPrev = Astronomy.Ecliptic(equatorPrev);
        const retrograde = ecliptic.elon < eclipticPrev.elon && (Math.abs(ecliptic.elon - eclipticPrev.elon) < 10); // Check wrap around

        return {
            body: b.name,
            sign: SIGNS[signIndex % 12],
            retrograde,
            degree
        };
    });
};