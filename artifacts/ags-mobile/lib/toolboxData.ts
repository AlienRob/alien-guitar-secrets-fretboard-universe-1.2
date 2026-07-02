export type Category = "expressive" | "rhythmic" | "melodic" | "advanced" | "tone" | "articulation";

export type Technique = {
  slug: string;
  num: number;
  name: string;
  category: Category;
  description: string;
  example: string;
  challenge: string;
  insight: string;
};

export const CATEGORY_META: Record<Category, { label: string; color: string; blurb: string }> = {
  expressive: {
    label: "Expressive",
    color: "#ff6b35",
    blurb: "The voice of the guitar — bends, slides, vibrato, and techniques that make notes sing.",
  },
  rhythmic: {
    label: "Rhythmic",
    color: "#00FFD5",
    blurb: "Turn the guitar into a groove instrument — muting, accents, and pocket playing.",
  },
  melodic: {
    label: "Melodic",
    color: "#a78bfa",
    blurb: "Organise notes into musical statements — arpeggios, targeting, and phrasing.",
  },
  advanced: {
    label: "Advanced",
    color: "#f59e0b",
    blurb: "Expand physical and musical range — picking efficiency, sweep, and string skipping.",
  },
  tone: {
    label: "Tone",
    color: "#FF6B9D",
    blurb: "Use the electric guitar as a sound-design instrument — harmonics, feedback, and dynamics.",
  },
  articulation: {
    label: "Articulation",
    color: "#A8FF3E",
    blurb: "Refine phrase edges — grace notes, trills, staccato, and ornamentation.",
  },
};

export const TECHNIQUES: Technique[] = [
  // ── EXPRESSIVE ─────────────────────────────────────────────────────────────
  {
    slug: "bends",
    num: 1,
    name: "Bends",
    category: "expressive",
    description:
      "A bend is one of the most vocal techniques on the guitar. Instead of simply fretting a note and accepting its fixed pitch, you physically push or pull the string so the note rises into a target pitch. This can be a small bluesy quarter-tone scoop, a half-step bend, a whole-step bend, or a wider dramatic bend. The key is intention. A bend should not sound like a random string stretch; it should sound like the note is reaching for something.\n\nBends are vital because they allow the guitar to imitate the human voice. They create tension, release, yearning, aggression, sadness, and triumph. The most important practice point is pitch accuracy. A great player bends to a destination and lands there confidently. Practise bending a note, then checking the target pitch by playing the fretted destination note. Add vibrato only after the bend is in tune.",
    example:
      "In A minor pentatonic, play the 8th fret on the B string and bend it up a whole tone so it reaches the sound of the 10th fret. Hold it, then release slowly back down before resolving to the 5th fret on the high E string. This creates a classic blues-rock phrase where the bend becomes the emotional peak of the lick.",
    challenge:
      "Pick a target note (the 10th fret B string, sounding like a D). Bend from two frets below and stop exactly on pitch. Hold for four beats. Then fret the target note normally and compare. They should sound identical. Do this in three different keys before moving on.",
    insight:
      "A bend that misses its pitch by even a quarter-tone sounds out of tune, not expressive. Accuracy is what separates a vocal bend from a random string pull.",
  },
  {
    slug: "slides",
    num: 2,
    name: "Slides",
    category: "expressive",
    description:
      "A slide connects two notes by keeping the string in contact with the fretboard while the fretting finger moves from one fret to another. The movement can travel upward for lift, downward for release, or across longer distances for a dramatic position shift. Slides make the fretboard feel horizontal and connected instead of like isolated boxes.\n\nSlides are powerful because they add continuity to a phrase. They can make a line sound smoother, more vocal, and more confident. A slide also tells the listener how you want the phrase to breathe. A fast slide can feel urgent. A slow slide can feel emotional and deliberate. The best slides are timed rhythmically, not thrown in randomly between notes.",
    example:
      "Over an E minor groove, start on the 7th fret of the A string and slide into the 9th fret to land on E. Follow with notes from the E minor pentatonic shape. The slide gives the phrase a sense of arrival before the melody begins, almost like a singer leaning into the first word of a line.",
    challenge:
      "Take any two-bar pentatonic phrase you already know. Replace the very first picked note with a slide that arrives on it from two frets below. Then find a phrase ending that descends — replace the last movement with a downward slide away from the final note. Record both versions and listen to how the slide changes the feel of the whole phrase.",
    insight:
      "A slide has rhythm. Decide whether it takes up part of the beat or arrives before the beat. That choice completely changes the feel of the phrase.",
  },
  {
    slug: "vibrato",
    num: 3,
    name: "Vibrato",
    category: "expressive",
    description:
      "Vibrato is the controlled oscillation of pitch around a note. On guitar it is usually created by rocking or rotating the fretting hand so the note gently moves sharp and relaxes back toward pitch. Vibrato is not just decoration. It is one of the strongest signs of a player's personality, touch, and maturity.\n\nThe quality of vibrato matters more than its speed. Wide vibrato can sound intense and heroic. Narrow vibrato can sound sweet and restrained. Slow vibrato can sound vocal and emotional. Fast vibrato can sound fiery and urgent. The goal is control. You should be able to start a note straight, delay the vibrato, then bring it in at the exact width and speed you choose.",
    example:
      "In a G major solo, resolve a phrase to the 12th fret on the G string and hold it for a full bar. Begin with no vibrato, then gradually add a slow, even vibrato. This turns a simple held note into a musical statement and gives the listener time to feel the resolution.",
    challenge:
      "Hold a single note for eight beats. Spend the first two beats completely still. Beats three and four: introduce the slowest vibrato you can manage. Beats five and six: widen it. Beats seven and eight: narrow it back down. The goal is conscious width control throughout, not just switching vibrato on and off.",
    insight:
      "Vibrato that starts the instant a note is picked sounds mechanical. The delay — that moment of stillness before the vibrato blooms — is where personality lives.",
  },
  {
    slug: "hammer-ons-pull-offs",
    num: 4,
    name: "Hammer-ons & Pull-offs",
    category: "expressive",
    description:
      "Hammer-ons and pull-offs are legato techniques that allow notes to sound with minimal picking. A hammer-on happens when a fretting finger strikes the fretboard hard enough to produce the next note. A pull-off happens when the finger releases while lightly plucking the string with the fingertip so a lower note rings out.\n\nThese techniques create fluidity. They help phrases flow across the fretboard and are essential for fast runs, melodic ornaments, and smooth scale passages. The danger is uneven volume. A strong legato player makes the picked note, hammered note, and pulled note feel connected and balanced. The fretting hand becomes responsible for both pitch and articulation.",
    example:
      "In A minor, pick the 5th fret on the high E string, hammer to the 8th fret, then pull back to the 5th fret. Repeat the same idea on the B string using the 5th and 8th frets. This creates a fast, smooth blues-rock figure without needing to pick every note.",
    challenge:
      "Play a one-octave minor pentatonic scale ascending using only hammer-ons after the first picked note per string, then descending using only pull-offs. Every note must be the same volume as the picked first note. If any hammered or pulled note is quieter, stop and isolate that finger until it matches.",
    insight:
      "The pulling finger is the weak link in most players' legato. A pull-off is a mini pluck — the fingertip has to grip the string slightly and release sideways, not just lift straight off.",
  },
  {
    slug: "tapping",
    num: 5,
    name: "Tapping",
    category: "expressive",
    description:
      "Tapping extends the fretting hand idea by using a finger from the picking hand to sound notes directly on the fretboard. Instead of the picking hand only striking the strings, it becomes a second fretting hand. This opens up wide intervals, fast patterns, and piano-like shapes that are difficult to play with one hand alone.\n\nTapping is often associated with flash, but it can also be extremely melodic. The trick is to think musically, not just mechanically. The tapped note should belong to the chord or scale sound you are aiming for. Clean muting is essential because both hands are on the fretboard and open strings can easily ring by accident.",
    example:
      "Over an E minor chord, fret the 5th and 8th frets on the B string with the left hand and tap the 12th fret with the right hand. Repeat the pattern as 5–8–12–8. This outlines a wide, singing E minor sound and can be moved across strings to build a dramatic solo passage.",
    challenge:
      "Take a simple three-note phrase from a scale you know well. Add a tapped note one octave above the highest fretting-hand note. The four-note pattern should sound like a musical idea, not just an exercise. Slow it down until every note is clear, then find the tempo where it starts to sing.",
    insight:
      "Tapping fails musically when the tapped note is chosen for reach, not for harmony. Always ask which scale degree the tapped note is before you commit to the pattern.",
  },
  {
    slug: "whammy-bar",
    num: 6,
    name: "Whammy Bar Dives & Flutter",
    category: "expressive",
    description:
      "The whammy bar, or tremolo arm, changes string tension and therefore pitch. A dive drops the pitch dramatically, sometimes until the note collapses into a roar. A flutter is created by flicking the bar so the bridge vibrates and produces a rapid shimmering pitch movement. Used well, the bar becomes part of the guitar's voice.\n\nThese sounds are most effective when they serve the moment. A dive can end a phrase with chaos, imitate a falling siren, or create a hard rock explosion. A flutter can make a harmonic sparkle or add futuristic movement to a sustained note. Control is everything: the bar should return to pitch reliably, and the player should know whether the effect is rhythmic, melodic, or purely atmospheric.",
    example:
      "Hit a natural harmonic at the 5th fret on the G string, then lightly flick the whammy bar for a flutter. Let the harmonic shimmer over a sustained chord. This works beautifully as a transition between sections or as a dramatic ending to a lead phrase.",
    challenge:
      "Use the bar for exactly one effect per musical section — one dive to end a phrase, one flutter on a harmonic. Do not use it a second time in that section. This forces you to choose the moment where it adds the most impact rather than reaching for it out of habit.",
    insight:
      "The most striking whammy effects are surprising because they are rare. Every extra use dilutes the impact of the ones before it.",
  },
  {
    slug: "harmonics",
    num: 7,
    name: "Harmonics",
    category: "expressive",
    description:
      "Harmonics are bell-like tones created by allowing specific parts of the string to vibrate while other parts are lightly touched or isolated. Natural harmonics occur at points such as the 12th, 7th, and 5th frets. Artificial harmonics and other controlled harmonic techniques allow the player to access these overtone sounds in more places.\n\nHarmonics add a completely different colour to the guitar. They can sound delicate, glassy, eerie, orchestral, or aggressive depending on the context. Because harmonics have a pure overtone quality, they can cut through a mix without needing a lot of volume. They also create contrast against normal fretted notes.",
    example:
      "In a clean intro, play natural harmonics across the 12th fret on the G, B, and high E strings, then answer them with a soft fretted melody. The harmonic notes create a spacious atmosphere before the main riff enters.",
    challenge:
      "Write a four-bar phrase where bar one is entirely fretted notes and bar three is entirely natural harmonics, with bars two and four as transitions. The harmonic bar should feel like a different texture — not a different song. The notes in each bar should be related to the same key.",
    insight:
      "Natural harmonics ring best when the fretting finger is placed directly above the fret wire, not behind it as with normal fretting. Even slight placement errors kill the tone.",
  },

  // ── RHYTHMIC ───────────────────────────────────────────────────────────────
  {
    slug: "syncopation",
    num: 8,
    name: "Syncopation",
    category: "rhythmic",
    description:
      "Syncopation means placing accents or notes away from the most expected beats. Instead of always emphasising beat 1, 2, 3, and 4, syncopation uses the off-beats, the ands, anticipations, and delayed accents to create movement. It is one of the main reasons a riff, rhythm part, or solo line feels alive.\n\nFor improvisation, syncopation stops scale playing from sounding like exercise practice. The exact same notes can sound basic or exciting depending on where they fall rhythmically. Syncopation teaches you to phrase like a drummer and to lock with the groove rather than simply run up and down the fretboard.",
    example:
      "Over a funk groove in E minor, play a short two-note idea on the and of beat 2 and the and of beat 4, leaving space on the downbeats. The silence makes the notes punch harder and gives the phrase a conversational, groove-based feel.",
    challenge:
      "Take a simple four-note scale run that you would normally play on beats 1–2–3–4. Shift it so it starts on the and of beat 1. Leave the downbeats empty. Loop a backing track and repeat until the syncopated version feels more natural than the straight version.",
    insight:
      "The downbeat does not need a note to feel strong. When the space around a note is rhythmically deliberate, the silence becomes as musical as the sound.",
  },
  {
    slug: "ghost-notes",
    num: 9,
    name: "Ghost Notes",
    category: "rhythmic",
    description:
      "Ghost notes are muted or partially muted notes that produce a percussive sound rather than a clear pitch. On guitar they are created by relaxing the fretting hand so the strings are deadened, then striking them rhythmically. They sit between rhythm and melody, giving a line bounce, attitude, and forward motion.\n\nGhost notes are essential for funk, blues, rock, fusion, and modern rhythm playing. They make the guitar behave like part of the drum kit. They also help separate melodic notes so the important pitches stand out. A phrase with ghost notes can feel more human because it includes breath, friction, and groove.",
    example:
      "In an A minor pentatonic riff, play a muted strum on the sixteenth note before a strong fretted note at the 7th fret on the D string. The ghost note acts like a drum pickup into the main note and makes a simple riff feel much more locked in.",
    challenge:
      "Play a simple four-beat riff you already know. Add a ghost note on every sixteenth-note gap between the main notes. Do not add pitch — just percussive deadened string hits. Record it and compare to the original. The groove should feel more alive even though you added no new melody.",
    insight:
      "Ghost notes are where funk lives. The 'scratch' of a muted string hit is what makes the fretted notes land harder. You cannot fake this with picking attack alone.",
  },
  {
    slug: "palm-muting",
    num: 10,
    name: "Palm Muting",
    category: "rhythmic",
    description:
      "Palm muting is created by resting the edge of the picking hand lightly against the strings near the bridge while picking. The closer the hand is to the bridge, the more pitch and sustain remain. The further forward it moves, the darker and more muted the sound becomes. It is a tone control built into the hands.\n\nPalm muting controls sustain, attack, and tightness. It is not only for heavy rhythm guitar. It can also be used in blues, country, pop, and clean arpeggios to shape dynamics. A player can move from muted to open notes within the same phrase, creating contrast between tension and release.",
    example:
      "Play an E power chord riff with the low E string palm-muted during the verse, then lift the palm for the final chord of the bar. The muted notes create pressure, while the open chord releases the energy and makes the rhythm part feel bigger.",
    challenge:
      "Play an eight-bar progression. Bars 1–4: fully palm-muted throughout. Bars 5–6: palm muting only on beats 1 and 3. Bars 7–8: no palm muting. The dynamic shift should feel like the song is building without you playing any extra notes.",
    insight:
      "Palm muting position is not fixed. Moving the hand one centimetre closer to the neck produces a dramatically different sound. Explore the full range of your muting position before settling on a 'default'.",
  },
  {
    slug: "chugs",
    num: 11,
    name: "Chugs",
    category: "rhythmic",
    description:
      "Chugs combine palm muting with strong, deliberate picking, often on the lower strings. They are the tight, aggressive, percussive engine behind many rock and metal riffs. A chug is not just a low note; it is a controlled attack that has weight, timing, and attitude.\n\nThe key to a great chug is consistency. The muting hand, picking depth, pick angle, and timing all need to work together. Chugs can be simple eighth notes, fast sixteenth notes, gallops, syncopated accents, or stop-start rhythmic punches. They give the guitar a powerful rhythmic identity.",
    example:
      "In drop D tuning, palm-mute the open low D string and play a pattern of two sixteenth notes followed by an eighth-note power chord stab at the 3rd fret. The chug supplies the drive and the chord stab creates the hook.",
    challenge:
      "Set a metronome to 80 bpm. Play a single-string chug pattern in sixteenth notes for two bars without any variation in volume, attack, or tone. Every single hit should be identical. Then try a gallop rhythm (eighth–sixteenth–sixteenth) at the same tempo with the same consistency.",
    insight:
      "The tightest chugs come from a locked relationship between pick depth and palm position. Change one without adjusting the other and the attack loses its authority.",
  },

  // ── MELODIC ────────────────────────────────────────────────────────────────
  {
    slug: "arpeggios",
    num: 12,
    name: "Arpeggios",
    category: "melodic",
    description:
      "An arpeggio is the sound of a chord played one note at a time. Instead of strumming all chord tones together, the player sequences them melodically. Arpeggios reveal the harmony inside a progression and allow a soloist to target the notes that truly belong to each chord.\n\nFor improvisation, arpeggios are the bridge between scale knowledge and musical targeting. A scale gives you a pool of possible notes, but an arpeggio shows the skeleton of the chord. When you land on chord tones at strong rhythmic moments, your solo sounds connected to the harmony instead of floating over it.",
    example:
      "Over a C major chord, outline C–E–G using the 3rd fret A string, 2nd fret D string, and open G string, then connect into notes from the C major scale. This instantly makes the line sound like it understands the chord underneath.",
    challenge:
      "Take a ii–V–I progression (e.g. Dm–G–C). For the first pass, solo using only arpeggio notes — no scale runs. Every note must be a chord tone of whichever chord is currently playing. It will feel sparse at first. That is the point. Once you can land chord tones deliberately, add scale notes as passing connections.",
    insight:
      "Knowing an arpeggio shape is not the same as using it musically. The value comes from placing the root, third, and fifth on strong beats, not just running the shape up and down.",
  },
  {
    slug: "chromatic-runs",
    num: 13,
    name: "Chromatic Runs",
    category: "melodic",
    description:
      "Chromatic runs use notes that move in semitones, often including tones outside the home scale. These outside notes create tension, colour, and momentum. The important idea is that chromatic notes usually work best when they lead somewhere clear rather than wander aimlessly.\n\nA chromatic run can make a phrase sound jazzy, bluesy, slippery, aggressive, or sophisticated. It adds spice because the listener hears notes that temporarily challenge the key. The resolution is what makes it work. If the phrase lands strongly on a chord tone or scale tone, the outside movement sounds intentional.",
    example:
      "In A minor, play a chromatic climb on the G string from the 5th fret to the 8th fret, then resolve to the 5th fret on the B string. The chromatic movement builds tension, and the resolution makes the line sound controlled.",
    challenge:
      "Choose a strong chord tone to land on — for example, the 5th of the key. Approach it chromatically from two semitones below, landing on the beat. Do this from above as well (two semitones above into the chord tone). Practice both approaches until the resolution sounds like the goal, not an accident.",
    insight:
      "A chromatic note is only 'outside' until it resolves. The listener forgives any dissonance the moment a strong chord tone arrives in the right place. The outside note earns its place by making the landing feel better.",
  },
  {
    slug: "pedal-tones",
    num: 14,
    name: "Pedal Tones",
    category: "melodic",
    description:
      "A pedal tone is a repeated note that stays constant while other notes change around it. On guitar this can be played as a repeated open string, a repeated fretted note, or a high note that alternates with moving scale tones. The fixed note acts like an anchor while the harmony or melody shifts.\n\nPedal tones are excellent for creating momentum and drama. They can make a line sound classical, metal, fusion, cinematic, or folk-like depending on the rhythm and note choices. Because the ear keeps returning to the same pitch, the surrounding notes feel more organised and the phrase gains a strong identity.",
    example:
      "In E minor, repeatedly strike the open high E string between notes from the E natural minor scale on the B string. The open E becomes the pedal tone, while the moving B-string notes create melody against it.",
    challenge:
      "Choose an open string as your pedal tone. Write a descending scalar passage on the adjacent string that alternates with that pedal tone on every other note. The pedal and the moving notes should form intervals that change with each step. Listen for which intervals create the most tension and which provide release.",
    insight:
      "The pedal tone does not need to be on the lowest string. A high pedal tone over a descending bass line creates a completely different emotional effect than a low pedal under a climbing melody.",
  },
  {
    slug: "question-answer-phrasing",
    num: 15,
    name: "Question & Answer Phrasing",
    category: "melodic",
    description:
      "Question and answer phrasing treats improvisation like conversation. One phrase asks a musical question, then the next phrase responds. This can happen through rhythm, register, dynamics, note choice, or tone. It is one of the clearest ways to stop soloing from sounding like a stream of unrelated licks.\n\nA good question usually leaves space or creates tension. A good answer usually resolves, contrasts, or comments on the first idea. This approach helps build solos with structure. It also teaches restraint, because not every moment needs to be filled. Space becomes part of the phrasing.",
    example:
      "Over a slow blues in A, play a short bend-based phrase in a higher register, then leave two beats of silence. Answer it with a lower phrase using A minor pentatonic notes around the 5th fret. The two phrases feel connected even though they use different areas of the neck.",
    challenge:
      "Record yourself improvising for two minutes with one rule: every phrase must be followed by silence at least as long as the phrase itself. Your playing will feel empty at first. By the end of two minutes, listen back. The phrases that land after the silence will feel far more powerful than anything that runs continuously.",
    insight:
      "The answer does not need to resolve immediately. Sometimes the most powerful response is to raise the tension even higher — forcing the real resolution to come one phrase later.",
  },

  // ── ADVANCED ───────────────────────────────────────────────────────────────
  {
    slug: "string-skipping",
    num: 16,
    name: "String Skipping",
    category: "advanced",
    description:
      "String skipping means deliberately jumping over one or more adjacent strings instead of always moving to the next string in sequence. This creates wider intervals and unexpected melodic shapes. It breaks the predictable sound of scale patterns that simply move across neighbouring strings.\n\nThe technique demands accuracy from both hands. The picking hand must locate non-adjacent strings cleanly, and the fretting hand must prepare shapes without relying on standard scale-box muscle memory. Musically, string skipping can make lines sound more modern, angular, open, and dramatic.",
    example:
      "In E minor, play a note on the 7th fret of the A string, skip the D string and jump to the 9th fret of the G string, then return. This creates a wider interval leap that sounds more striking than moving step-by-step through the scale.",
    challenge:
      "Take a four-note pattern you know on adjacent strings and rewrite it so it skips one string. The notes stay the same; only the strings change. Pay attention to which intervals now appear. Some will sound angular and modern. Others will sound surprisingly melodic. Choose the skipping arrangement that serves the musical idea best.",
    insight:
      "String skipping reveals the fretboard as a two-dimensional space. Once you stop thinking horizontally across adjacent strings, entirely new interval combinations become available.",
  },
  {
    slug: "sweep-picking",
    num: 17,
    name: "Sweep Picking",
    category: "advanced",
    description:
      "Sweep picking uses a single continuous picking motion across multiple strings, usually to play arpeggios. Instead of alternate picking each string separately, the pick glides through the strings like a controlled strum, while the fretting hand releases each note so they do not ring into each other too much.\n\nThe technique is often used for speed, but the real goal is smoothness and clarity. A great sweep-picked arpeggio sounds like a rapid, clean harp-like outline of a chord. Muting is crucial. Without good separation, the arpeggio becomes a blurred chord rather than a melodic line.",
    example:
      "Over an A minor chord, sweep a three-string A minor triad shape on the G, B, and high E strings, then resolve to a sustained A note. The arpeggio gives the line harmonic definition and the final note gives it a clear landing point.",
    challenge:
      "Before attempting speed, practice the fretting hand independently: finger the sweep shape without picking and roll the fretting pressure so each note rings clearly and then stops before the next one sounds. No note should overlap its neighbour. Only add the pick motion once the fretting hand can do this cleanly at slow tempo.",
    insight:
      "Sweep picking is 90% fretting hand. Most players try to solve clarity problems by slowing the pick arm, when the actual problem is that the fretting hand is not releasing the previous note in time.",
  },
  {
    slug: "hybrid-picking",
    num: 18,
    name: "Hybrid Picking",
    category: "advanced",
    description:
      "Hybrid picking uses the pick and the remaining fingers of the picking hand together. The pick may strike lower strings while the middle and ring fingers pluck higher strings. This creates patterns that are difficult or awkward with pick-only technique and gives the player greater control over string separation.\n\nHybrid picking is useful for country, blues, rock, fusion, funk, and chord-melody playing. It can sound snappy and percussive or smooth and intricate. It also allows quick jumps between non-adjacent strings without needing large picking-hand movements.",
    example:
      "Hold an A7 chord shape and use the pick on the A string while plucking the G and B strings with the middle and ring fingers. This creates a tight, punchy blues comping pattern that sounds more dynamic than strumming the chord.",
    challenge:
      "Play any chord voicing where the bass note and the melody note are three or more strings apart. Use the pick on the bass note and a finger on the melody note simultaneously. Once you can play two strings cleanly together, extend to three — pick plus two fingers in parallel. The separation between strings is the technique.",
    insight:
      "The snappy 'chicken-picking' sound of country guitar comes from the middle finger catching the string slightly under the nail and releasing it so it snaps back against the fretboard. This is a specific motion, not just plucking.",
  },
  {
    slug: "economy-picking",
    num: 19,
    name: "Economy Picking",
    category: "advanced",
    description:
      "Economy picking combines alternate picking with small sweep-like motions when changing strings in the same direction. If the pick is already moving downward and the next note is on a lower-pitched adjacent string, it continues downward. If it is moving upward and the next note is on a higher-pitched adjacent string, it continues upward.\n\nThe goal is efficiency. Economy picking reduces unnecessary pick motion and can make fast scale passages feel smoother. However, it must still sound rhythmically even. The danger is that the swept string changes can rush. Practise slowly with a metronome so the pick path becomes efficient without losing time feel.",
    example:
      "Play a three-note-per-string G major scale. When moving from the high E string to the B string during a descending line, let the upstroke continue through to the next string instead of resetting the pick. This creates a faster, more economical string crossing.",
    challenge:
      "Mark the string-change points in a scale run you already know. At each string change, consciously decide whether alternate or economy (continued direction) picking is more efficient. Practise the run with deliberate economy at the marked points until it feels as natural as alternate picking. Then test both approaches at full speed and listen for the difference in fluidity.",
    insight:
      "Economy picking does not replace alternate picking — it supplements it at string crossings. Players who try to economy-pick everything often develop rhythmic unsteadiness. Use it surgically.",
  },
  {
    slug: "legato-runs",
    num: 20,
    name: "Legato Runs",
    category: "advanced",
    description:
      "Legato runs use hammer-ons, pull-offs, and slides to create rapid, flowing lines with minimal picking. The notes connect smoothly, almost like a saxophone or violin line. In rock and fusion guitar, legato is a major pathway to speed without relying entirely on picking stamina.\n\nThe challenge is articulation. Legato should not become a weak blur of notes. Every note needs enough volume and timing clarity to be heard. A strong legato player can choose where to pick, where to hammer, where to pull off, and where to slide so the phrase breathes naturally.",
    example:
      "In D Dorian, pick the first note of each string and use hammer-ons for the next two notes in a three-note-per-string pattern. Descend using pull-offs. The result is a smooth modal run that sounds fluid rather than mechanically picked.",
    challenge:
      "Record a legato run, then listen back with your eyes closed. Count how many notes you can actually hear distinctly. If the answer is fewer than you played, your fretting-hand strength or timing is causing some notes to disappear. Slow down until every note is equally audible, then rebuild speed gradually.",
    insight:
      "Fast legato is not about removing the work — it is about moving the work from the picking hand to the fretting hand. The result should sound effortless, but the fretting hand is working hard.",
  },

  // ── TONE ───────────────────────────────────────────────────────────────────
  {
    slug: "pinch-harmonics",
    num: 21,
    name: "Pinch Harmonics",
    category: "tone",
    description:
      "A pinch harmonic is created when the pick strikes the string and the edge of the thumb immediately brushes the string to excite a harmonic overtone. The result is a high-pitched squeal or scream that can leap out of the amp. Where you pick along the string changes which harmonic speaks.\n\nThis technique is highly touch-sensitive. Gain, pickup selection, pick angle, and muting all affect the result, but the hand is still the main factor. Pinch harmonics work best when used as accents rather than constant decoration. They can make a riff snarl or make a lead note explode with attitude.",
    example:
      "In an E minor rock riff, play a fretted note on the 7th fret of the A string and add a pinch harmonic on the final repeat. The harmonic acts like an exclamation mark at the end of the riff.",
    challenge:
      "Find the three sweetest-sounding pick positions for a pinch harmonic on the same fretted note (try near the bridge pickup, over the middle, and between pickups). Note how the squeal character changes at each position. Then practise landing the pinch consistently at your favourite spot without looking at your picking hand.",
    insight:
      "The amount of thumb that brushes the string must be tiny — even a few millimetres. Too much thumb kills the note completely. Too little and the harmonic does not speak. Practice is finding the exact edge.",
  },
  {
    slug: "volume-swells",
    num: 22,
    name: "Volume Swells",
    category: "tone",
    description:
      "A volume swell gradually brings a note in after the pick attack has been hidden. This can be done with the guitar volume knob, a volume pedal, or sometimes with picking-hand control. Because the attack disappears, the note can sound more like a violin, synth pad, or distant voice.\n\nVolume swells are about atmosphere and dynamics. They are perfect when you want the guitar to support a section without sounding like a normal plucked instrument. They can also be combined with delay, reverb, and harmonics to create cinematic textures.",
    example:
      "Over a clean D major chord progression, pick a note with the volume rolled down, then slowly raise the volume so the note blooms into the chord. Add delay and let each swell overlap slightly, creating a spacious ambient layer.",
    challenge:
      "Using only volume swells (no normal picking attack), improvise a four-bar melody over a slow chord progression. Every note must bloom in. Your entire focus shifts from pitch placement to timing the swell so each note reaches full volume at a musically meaningful moment — usually the beat, not before it.",
    insight:
      "The swell rate — how fast the volume rises — is where the emotion lives. A slow bloom over two beats sounds orchestral. A fast bloom in half a beat sounds more like a normal note with a softer attack. Control the rate deliberately.",
  },
  {
    slug: "pick-scrapes",
    num: 23,
    name: "Pick Scrapes",
    category: "tone",
    description:
      "A pick scrape is made by dragging the edge of the pick along the wound strings. Depending on direction, pressure, and distortion level, it can sound gritty, aggressive, rising, falling, or explosive. It is more of a sound effect than a melodic note, but it can be extremely effective in the right place.\n\nPick scrapes are useful for transitions, buildups, and moments of attitude. They should be rhythmically placed so they land into a riff or chord with purpose. Too many scrapes can quickly become gimmicky, but a well-timed scrape can make a section feel bigger and more dramatic.",
    example:
      "Before the chorus of a hard rock song, drag the pick down the low E and A strings across one beat, then land on a big open E power chord. The scrape creates tension and the chord releases it.",
    challenge:
      "Time one pick scrape so it ends exactly on beat 1 of a new section. This means starting the scrape slightly before the bar ends, at a speed that brings it to completion exactly on the downbeat. Drag length and speed must be precise. Recording yourself is the only reliable way to check the timing.",
    insight:
      "A scrape that overshoots the beat by even a quarter-beat kills the momentum it was supposed to build. Map out the timing before you add it to a song.",
  },
  {
    slug: "feedback-control",
    num: 24,
    name: "Feedback Control",
    category: "tone",
    description:
      "Feedback happens when the amplified guitar sound resonates back through the strings and pickups, causing notes to sustain or bloom into overtones. Uncontrolled feedback can be messy, but controlled feedback can be one of the most expressive sounds in electric guitar playing.\n\nGood feedback control involves volume, gain, distance from the amp, guitar angle, muting, and note choice. The player learns where the instrument wants to resonate and uses that energy musically. Feedback can extend a note beyond normal sustain and make the guitar feel alive.",
    example:
      "At the end of a solo, hold a high A note with vibrato while facing the amp. Let the note begin feeding back, then control it with the fretting hand and volume knob. The note sustains into a dramatic emotional peak instead of simply fading away.",
    challenge:
      "Find the feedback threshold for three different fretted notes on your guitar at your usual gain setting. Note which notes feed back most easily (usually the ones that match the amp's resonant frequency). Then practice letting feedback begin and stopping it with a brief volume knob roll-back before it becomes uncontrolled. The goal is to start and stop it intentionally.",
    insight:
      "Feedback is not random — it is the amp responding to specific string frequencies. Higher gain, certain guitar angles, and proximity to the speaker all change which notes want to feed back. Learn your instrument's natural resonant tendencies.",
  },
  {
    slug: "artificial-harmonics",
    num: 25,
    name: "Artificial Harmonics",
    category: "tone",
    description:
      "Artificial harmonics allow the player to create harmonic overtones from fretted notes rather than only using open-string natural harmonic points. This can include touch harmonics, tapped harmonics, and other controlled overtone techniques. The player frets a note, then creates a harmonic at a precise interval above it.\n\nArtificial harmonics expand the harmonic language of the guitar. They allow bell-like sounds in melodic contexts where natural harmonics would not normally be available. They require precision because the harmonic point shifts depending on the fretted note. This makes fretboard awareness extremely important.",
    example:
      "Fret the 5th fret on the B string and lightly touch 12 frets higher with the picking hand while plucking the string. The resulting artificial harmonic gives a bright, bell-like version of the fretted note and can be used as a sparkling ending to a phrase.",
    challenge:
      "Play a simple three-note melody using artificial harmonics only — fretting each note normally while touching 12 frets above with the picking hand. Every note in the melody should ring as a bell-like harmonic. The challenge is that the picking-hand touch-point must shift with every fretting-hand position, so fretboard geometry becomes part of the technique.",
    insight:
      "The '12 frets above the fretted note' rule always produces the octave harmonic. But touching 7 frets above produces a different harmonic (two octaves plus a fifth). Experiment with the distance to discover the full palette of artificial harmonic colours.",
  },

  // ── ARTICULATION ───────────────────────────────────────────────────────────
  {
    slug: "grace-notes",
    num: 26,
    name: "Grace Notes",
    category: "articulation",
    description:
      "A grace note is a quick note played immediately before a main note. It is usually not heard as a full rhythmic event; instead, it decorates or pushes into the target note. On guitar, grace notes can be hammered, slid, picked, or bent into place.\n\nGrace notes add elegance, blues feel, and human nuance. They stop melodies from sounding plain by giving important notes a small lead-in. The main note still matters most. The grace note should support it, not steal attention from it. Timing and touch are crucial.",
    example:
      "In A minor pentatonic, quickly hammer from the 5th fret to the 7th fret on the D string, with the 7th fret as the main note. The 5th fret acts as a grace note and gives the phrase a more vocal blues character.",
    challenge:
      "Take a four-bar melody and add a grace note to exactly three of the most important notes — the notes that define the phrase. The grace note should arrive so quickly before the main note that a listener would struggle to count it as a separate beat. If it takes up rhythmic space, slow it down further.",
    insight:
      "Grace notes work because they imitate the human voice. Singers naturally slide into pitches rather than starting them cold. A grace note gives the guitar the same kind of vocal approach — a lean into the target.",
  },
  {
    slug: "trills",
    num: 27,
    name: "Trills",
    category: "articulation",
    description:
      "A trill rapidly alternates between two notes, usually using a hammer-on and pull-off cycle. The notes may be a tone apart, a semitone apart, or sometimes wider. Trills can be short ornaments or longer sustained bursts of energy.\n\nTrils create intensity and motion without changing position much. They are useful for classical-influenced lines, rock tension, blues decorations, and fusion phrasing. The trick is keeping the rhythm even and the volume balanced between both notes. A trill should sound controlled, not like the hand is panicking.",
    example:
      "Over an E minor vamp, trill between the 12th and 15th frets on the B string, then resolve to the 12th fret on the high E string. The trill creates suspense before the final note releases the line.",
    challenge:
      "Set a metronome to 60 bpm. Trill in sixteenth notes (four per beat) for four beats without slowing or speeding. Both the lower and upper note must be equal in volume. Record it. Most players will hear the lower note (the pulled note) drop in volume. Isolate and strengthen the pull-off until the two notes are balanced.",
    insight:
      "A fast trill that runs out of evenness becomes a blur rather than an ornament. A shorter, controlled trill with rhythmic authority does more for the phrase than a long uneven one.",
  },
  {
    slug: "glissandos",
    num: 28,
    name: "Glissandos",
    category: "articulation",
    description:
      "A glissando is a sweeping slide across a range of pitches. Unlike a targeted slide between two exact notes, a glissando often emphasises the motion itself. It can move up or down the fretboard and may be precise, wild, smooth, or dramatic depending on the context.\n\nGlissandos are useful for entrances, exits, transitions, and emotional gestures. They can make the guitar sound fluid and expressive, especially when used with delay or gain. A glissando can also reset the listener's ear by moving quickly from one register to another.",
    example:
      "After a high-register phrase in G minor, slide rapidly down the high E string toward the lower frets, then land on a low G power chord. The glissando creates a dramatic fall from lead line into rhythm hit.",
    challenge:
      "Use a glissando to enter a section and a glissando to exit it — but make the two glissandos move in opposite directions. The entering glissando rises into the first note. The exiting glissando falls away from the last note. Record the section and listen to whether the two sweeping motions create a satisfying arc.",
    insight:
      "A glissando feels most dramatic when it ends on a rhythmically strong beat. The sweep is the anticipation; the landing is the release. If the landing is late or off-beat, the gesture loses its power.",
  },
  {
    slug: "staccato-picking",
    num: 29,
    name: "Staccato Picking",
    category: "articulation",
    description:
      "Staccato picking means playing short, separated notes. Instead of allowing every note to ring, the player cuts each note off quickly using the fretting hand, picking hand, or both. This creates a sharp, precise, and rhythmic articulation.\n\nStaccato articulation is useful when a phrase needs punch, clarity, or attitude. It can make single-note lines behave like rhythmic riffs. It is also an excellent discipline for timing because the silence between notes becomes just as important as the notes themselves.",
    example:
      "In a funk-rock line, play a sequence of notes from E minor pentatonic as short sixteenth notes, cutting each note off immediately after it sounds. The result is tight, percussive, and locked to the groove.",
    challenge:
      "Take a phrase you normally play with sustained notes and replay it as completely staccato — every note cut to roughly half its original length. Do the same phrase again with normal sustain. Record both. The staccato version should feel rhythmically stronger and more aggressive. If it just sounds thin, your muting is not clean enough — some strings are still ringing slightly.",
    insight:
      "True staccato requires active muting, not just releasing finger pressure. The most reliable method on guitar is a combination: the fretting hand relaxes pressure and the picking hand lightly touches the strings to kill any remaining resonance.",
  },
  {
    slug: "octave-doubling",
    num: 30,
    name: "Octave Doubling",
    category: "articulation",
    description:
      "Octave doubling means playing the same melodic idea in two octaves, either simultaneously or as a call-and-response between registers. On guitar, octave shapes can create strong, clear lines that cut through a band mix without sounding too thick or chord-heavy.\n\nOctaves add emphasis and authority. They can make a riff sound bigger, a melody more memorable, or a solo line more arranged. Because the same pitch class is heard in two registers, the listener recognises the idea immediately while feeling extra weight and width.",
    example:
      "Play a simple G minor melody on the D string, then repeat the same melody an octave higher on the B string. In a band arrangement, the lower phrase can sound like the statement and the higher octave can sound like the answer.",
    challenge:
      "Take a four-bar melody. Play bar 1 in a lower register. Play bar 2 as an exact octave-higher repeat. Bar 3: play both octaves simultaneously. Bar 4: back to the lower octave alone. This forces you to locate the same melody in multiple fretboard positions and shows you how register choice changes the emotional weight of an identical phrase.",
    insight:
      "The classic Wes Montgomery octave shape (two strings apart, two frets higher) works cleanly on adjacent string pairs across the whole neck. Once this shape is under your fingers, any melody can be doubled in octaves almost immediately.",
  },
];
