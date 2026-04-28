export interface BgmTrack {
  id: string
  title: string
  category: 'wedding' | 'baby'
  url: string
  artist: string
  license: string
  source: string
}

export const BGM_TRACKS: BgmTrack[] = [
  { id: 'wedding-white-petals',     title: 'White Petals',         category: 'wedding', url: '/music/wedding/white-petals.mp3',     artist: 'Keys of Moon',           license: 'CC BY 4.0', source: 'https://www.chosic.com/download-audio/27279/' },
  { id: 'wedding-warm-memories',    title: 'Warm Memories',        category: 'wedding', url: '/music/wedding/warm-memories.mp3',    artist: 'Keys of Moon',           license: 'CC BY 4.0', source: 'https://www.chosic.com/download-audio/27281/' },
  { id: 'wedding-sweet',            title: 'Sweet',                category: 'wedding', url: '/music/wedding/sweet.mp3',            artist: 'LiQWYD',                 license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/28074/' },
  { id: 'wedding-beloved',          title: 'Beloved',              category: 'wedding', url: '/music/wedding/beloved.mp3',          artist: 'Roa',                    license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/60850/' },
  { id: 'wedding-fall-in-love',     title: 'Fall In Love',         category: 'wedding', url: '/music/wedding/fall-in-love.mp3',     artist: 'Alex-Productions',       license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/59374/' },
  { id: 'wedding-magic-valentines', title: "Magic Valentine's",    category: 'wedding', url: '/music/wedding/magic-valentines.mp3', artist: 'Alex-Productions',       license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/60849/' },
  { id: 'baby-happy-clappy-ukulele',title: 'Happy Clappy Ukulele', category: 'baby',    url: '/music/baby/happy-clappy-ukulele.mp3',artist: 'Shane Ivers',            license: 'CC BY 4.0', source: 'https://www.chosic.com/download-audio/27306/' },
  { id: 'baby-happy-joyful-children',title: 'Happy & Joyful',      category: 'baby',    url: '/music/baby/happy-joyful-children.mp3',artist: 'FM Free Music',         license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/29781/' },
  { id: 'baby-its-your-birthday',   title: "It's Your Birthday!",  category: 'baby',    url: '/music/baby/its-your-birthday.mp3',   artist: 'Monk Turner + Fascinoma',license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/28031/' },
  { id: 'baby-tiny-paws',           title: 'Tiny Paws',            category: 'baby',    url: '/music/baby/tiny-paws.mp3',           artist: 'Sakura Girl',            license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/60856/' },
  { id: 'baby-cheerful-whistling',  title: 'Cheerful Whistling',   category: 'baby',    url: '/music/baby/cheerful-whistling.mp3', artist: 'FM Free Music',          license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/29782/' },
  { id: 'baby-cheer-up',            title: 'Cheer Up',             category: 'baby',    url: '/music/baby/cheer-up.mp3',            artist: 'Sakura Girl',            license: 'CC BY 3.0', source: 'https://www.chosic.com/download-audio/60570/' },
]

export function getTrackById(id: string | undefined): BgmTrack | undefined {
  if (!id) return undefined
  return BGM_TRACKS.find((t) => t.id === id)
}

export function getTrackByUrl(url: string | undefined): BgmTrack | undefined {
  if (!url) return undefined
  return BGM_TRACKS.find((t) => t.url === url)
}

// 카테고리 슬러그를 받아 추천 프리셋 트랙 목록을 돌려준다.
// wedding은 wedding 6개, baby/birthday는 baby 6개, 그 외는 전체(추후 큐레이션 여지).
export function getTracksForCategory(slug: string | null | undefined): BgmTrack[] {
  if (slug === 'wedding') return BGM_TRACKS.filter((t) => t.category === 'wedding')
  if (slug === 'baby' || slug === 'birthday') return BGM_TRACKS.filter((t) => t.category === 'baby')
  return BGM_TRACKS
}
