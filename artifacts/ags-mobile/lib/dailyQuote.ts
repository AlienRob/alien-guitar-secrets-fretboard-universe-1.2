export interface Quote {
  text: string;
  author: string;
  role?: string;
}

const QUOTES: Quote[] = [

  // ── Guitarists ─────────────────────────────────────────────────────────────
  { text: "Knowledge speaks, but wisdom listens.", author: "Jimi Hendrix", role: "Guitarist" },
  { text: "When the power of love overcomes the love of power, the world will know peace.", author: "Jimi Hendrix", role: "Guitarist" },
  { text: "Music doesn't lie. If there is something to be changed in this world, then it can only happen through music.", author: "Jimi Hendrix", role: "Guitarist" },
  { text: "I don't read music. I wander around on the guitar until something starts talking to me.", author: "Jimi Hendrix", role: "Guitarist" },
  { text: "Your playing is a transmission of your state of being.", author: "Carlos Santana", role: "Guitarist" },
  { text: "The most valuable thing I can share is my intention and my passion.", author: "Carlos Santana", role: "Guitarist" },
  { text: "I believe every guitar player inherently has something unique about their playing. They just have to identify what makes them different and develop it.", author: "Jimmy Page", role: "Guitarist" },
  { text: "The guitar is the easiest instrument to play and the hardest to play well.", author: "Andrés Segovia", role: "Guitarist" },
  { text: "The blues is a tonic for whatever ails you.", author: "B.B. King", role: "Blues Guitarist" },
  { text: "All musicians are inspired by others. Nobody steals anything — we all stand on each other's shoulders.", author: "B.B. King", role: "Blues Guitarist" },
  { text: "If you pick up a guitar and it says something to you, pick it up. Don't let it collect dust.", author: "Stevie Ray Vaughan", role: "Guitarist" },
  { text: "Nobody wants to hear a guitar player who's not saying anything.", author: "Jeff Beck", role: "Guitarist" },
  { text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp", role: "Guitarist" },
  { text: "Playing music is not about technique. It's about feeling.", author: "David Gilmour", role: "Guitarist" },
  { text: "The guitar was just the vehicle. Music was always bigger than any one instrument.", author: "Eric Clapton", role: "Guitarist" },
  { text: "The blues are the roots and the other musics are the fruits.", author: "Willie Dixon", role: "Blues Musician" },

  // ── Other musicians ────────────────────────────────────────────────────────
  { text: "To play a wrong note is insignificant; to play without passion is inexcusable.", author: "Ludwig van Beethoven", role: "Composer" },
  { text: "Music is a higher revelation than all wisdom and philosophy.", author: "Ludwig van Beethoven", role: "Composer" },
  { text: "Music is the space between the notes.", author: "Claude Debussy", role: "Composer" },
  { text: "One good thing about music — when it hits you, you feel no pain.", author: "Bob Marley", role: "Musician" },
  { text: "Don't play what's there. Play what's not there.", author: "Miles Davis", role: "Trumpeter" },
  { text: "It takes a long time to play like yourself.", author: "Miles Davis", role: "Trumpeter" },
  { text: "You've got to learn your instrument. Then practice, practice, practice. Then forget all that and just wail.", author: "Charlie Parker", role: "Musician" },
  { text: "The notes I handle no better than many pianists. But the pauses between the notes — ah, that is where the art resides.", author: "Artur Schnabel", role: "Pianist" },
  { text: "Where words fail, music speaks.", author: "Hans Christian Andersen", role: "Author" },
  { text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley", role: "Author" },

  // ── Joseph Campbell ────────────────────────────────────────────────────────
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell", role: "Mythologist" },
  { text: "Follow your bliss and the universe will open doors where there were only walls.", author: "Joseph Campbell", role: "Mythologist" },
  { text: "The privilege of a lifetime is being who you are.", author: "Joseph Campbell", role: "Mythologist" },
  { text: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.", author: "Joseph Campbell", role: "Mythologist" },
  { text: "Find a place inside where there's joy, and the joy will burn out the pain.", author: "Joseph Campbell", role: "Mythologist" },
  { text: "The hero's journey is about the courage to seek the depths.", author: "Joseph Campbell", role: "Mythologist" },

  // ── Neale Donald Walsch ────────────────────────────────────────────────────
  { text: "Life begins at the end of your comfort zone.", author: "Neale Donald Walsch", role: "Author" },
  { text: "The deepest secret is that life is not a process of discovery, but a process of creation.", author: "Neale Donald Walsch", role: "Author" },
  { text: "You are already a perfect expression of God. There is nothing to become. There is only something to be.", author: "Neale Donald Walsch", role: "Author" },
  { text: "God is not asking you to prove yourself. God is asking you to be yourself.", author: "Neale Donald Walsch", role: "Author" },
  { text: "What you resist, persists. What you embrace, dissolves.", author: "Neale Donald Walsch", role: "Author" },
  { text: "Your soul has no agenda other than the fullest expression of itself.", author: "Neale Donald Walsch", role: "Author" },

  // ── Wayne Dyer ─────────────────────────────────────────────────────────────
  { text: "You don't need to be better than anyone else. You just need to be better than you used to be.", author: "Wayne Dyer", role: "Author" },
  { text: "You are not stuck where you are unless you decide to be.", author: "Wayne Dyer", role: "Author" },
  { text: "When you change the way you look at things, the things you look at change.", author: "Wayne Dyer", role: "Author" },
  { text: "There is no scarcity of opportunity to make a living at what you love. There's only scarcity of resolve to make it happen.", author: "Wayne Dyer", role: "Author" },
  { text: "Doing what you love is the cornerstone of having abundance in your life.", author: "Wayne Dyer", role: "Author" },
  { text: "You are a divine creation. A being of light. Remember this when the world makes you forget.", author: "Wayne Dyer", role: "Author" },

  // ── Deepak Chopra ──────────────────────────────────────────────────────────
  { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra", role: "Author" },
  { text: "Every time you are tempted to react in the same old way, ask if you want to be a prisoner of the past or a pioneer of the future.", author: "Deepak Chopra", role: "Author" },
  { text: "You are not in the universe. You are the universe — an intrinsic part of it.", author: "Deepak Chopra", role: "Author" },
  { text: "Within every desire is the mechanics of its fulfillment.", author: "Deepak Chopra", role: "Author" },

  // ── Eckhart Tolle ──────────────────────────────────────────────────────────
  { text: "Realize deeply that the present moment is all you ever have.", author: "Eckhart Tolle", role: "Teacher" },
  { text: "You find peace not by rearranging the circumstances of your life, but by realizing who you are at the deepest level.", author: "Eckhart Tolle", role: "Teacher" },
  { text: "Life is the dancer and you are the dance.", author: "Eckhart Tolle", role: "Teacher" },
  { text: "The power for creating a better future is contained in the present moment.", author: "Eckhart Tolle", role: "Teacher" },

  // ── Marianne Williamson ────────────────────────────────────────────────────
  { text: "Our deepest fear is not that we are inadequate. Our deepest fear is that we are powerful beyond measure.", author: "Marianne Williamson", role: "Author" },
  { text: "As we let our own light shine, we unconsciously give other people permission to do the same.", author: "Marianne Williamson", role: "Author" },
  { text: "You are a child of God. Your playing small doesn't serve the world.", author: "Marianne Williamson", role: "Author" },

  // ── Rumi ───────────────────────────────────────────────────────────────────
  { text: "Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there.", author: "Rumi", role: "Poet" },
  { text: "The wound is the place where the light enters you.", author: "Rumi", role: "Poet" },
  { text: "Let the beauty of what you love be what you do.", author: "Rumi", role: "Poet" },
  { text: "What you seek is seeking you.", author: "Rumi", role: "Poet" },
  { text: "You were born with wings. Why prefer to crawl through life?", author: "Rumi", role: "Poet" },
  { text: "Sell your cleverness and buy bewilderment.", author: "Rumi", role: "Poet" },

  // ── Kahlil Gibran ──────────────────────────────────────────────────────────
  { text: "Your pain is the breaking of the shell that encloses your understanding.", author: "Kahlil Gibran", role: "Poet" },
  { text: "Out of suffering have emerged the strongest souls.", author: "Kahlil Gibran", role: "Poet" },
  { text: "And forget not that the earth delights to feel your bare feet and the winds long to play with your hair.", author: "Kahlil Gibran", role: "Poet" },

  // ── Teilhard de Chardin ────────────────────────────────────────────────────
  { text: "We are not human beings having a spiritual experience. We are spiritual beings having a human experience.", author: "Teilhard de Chardin", role: "Philosopher" },
  { text: "Someday, after mastering the winds, the waves, the tides and gravity, we shall harness the energies of love, and then, for a second time in the history of the world, man will have discovered fire.", author: "Teilhard de Chardin", role: "Philosopher" },

  // ── Ralph Waldo Emerson ────────────────────────────────────────────────────
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", role: "Philosopher" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", role: "Philosopher" },
  { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson", role: "Philosopher" },

  // ── Biblical ───────────────────────────────────────────────────────────────
  { text: "I can do all things through Christ who strengthens me.", author: "Philippians 4:13", role: "Scripture" },
  { text: "For I know the plans I have for you — plans to prosper you and not to harm you, plans to give you hope and a future.", author: "Jeremiah 29:11", role: "Scripture" },
  { text: "Ask and it shall be given to you; seek and you shall find; knock and the door shall be opened unto you.", author: "Matthew 7:7", role: "Scripture" },
  { text: "Be still, and know that I am God.", author: "Psalm 46:10", role: "Scripture" },
  { text: "For as he thinketh in his heart, so is he.", author: "Proverbs 23:7", role: "Scripture" },
  { text: "The kingdom of God is within you.", author: "Luke 17:21", role: "Scripture" },

  // ── Practice & mastery ─────────────────────────────────────────────────────
  { text: "Don't practice until you get it right. Practice until you can't get it wrong.", author: "Anonymous" },
  { text: "The master has failed more times than the beginner has tried.", author: "Stephen McCranie" },
  { text: "Talent is a pursued interest. Anything you're willing to practice, you can do.", author: "Bob Ross", role: "Artist" },
  { text: "A year from now you will wish you had started today.", author: "Karen Lamb" },

  // ── Zashtar originals ──────────────────────────────────────────────────────
  { text: "The strings are the stars. The neck is the cosmos. You are the astronaut.", author: "Zashtar", role: "Alien Guitar Master" },
  { text: "Every fret you learn is a door. Every scale is a corridor. Keep walking.", author: "Zashtar", role: "Alien Guitar Master" },
  { text: "The universe vibrates. So do your strings. That is not a coincidence.", author: "Zashtar", role: "Alien Guitar Master" },
  { text: "A wrong note played with conviction is still a conversation. Silence is not.", author: "Zashtar", role: "Alien Guitar Master" },
  { text: "Your soul chose the guitar. Trust it.", author: "Zashtar", role: "Alien Guitar Master" },
];

/** Returns the same quote for everyone on a given calendar day. */
export function getDailyQuote(): Quote {
  const dayIndex = Math.floor(Date.now() / 86_400_000); // days since epoch
  return QUOTES[dayIndex % QUOTES.length];
}
