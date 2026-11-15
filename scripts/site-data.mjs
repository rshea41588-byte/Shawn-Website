import courses from './data/courses.json' with { type:'json' };
import schedule from './data/schedule.json' with { type:'json' };

export { courses, schedule };
export const defaultOrigin = 'https://precisionjiujitsunh.com';
export const gym = {
  name:'Precision Jiu Jitsu', phone:'(603) 459 3610', telephone:'+16034593610',
  email:'precisionjiujitsu29@gmail.com', address:'14 Brady Drive, Unit 2, Hudson, NH 03051',
  map:'https://maps.app.goo.gl/SAXEqSEeRz2kBamw6', kidsMinimumAge:5
};
export const courseNotes = {
  'arm-bar-it-all': {
    short:'Arm Bar It All', category:'Submissions', focus:'Follow the arm attack.',
    intro:'Explore how an armbar connects to the position around it. This course follows arm attacks from top positions, guard and standing exchanges, rather than limiting the finish to a single entry.',
    fit:'Choose this topic if you want to compare armbar entries across several positions. The four volumes let you locate a familiar starting position, then see how the same finishing goal appears elsewhere.',
    practice:'When watching, separate the entry from the control that follows it. Notice which position a section starts from before choosing what to revisit with your coach. Standing and flying entries are a distinct part of the catalog; ask your coach about appropriate practice before attempting them.',
    comparison:'Precision Top Stuff has a broader focus on top positions and several submission families. Arm Bar It All keeps the arm attack as the common thread, including material from underneath and on the feet.',
    related:['precision-top-stuff','butterfly-half-and-knee-shield']
  },
  'precision-wrestling-for-jiu-jitsu': {
    short:'Precision Wrestling For Jiu Jitsu', category:'Standing wrestling', focus:'Start with the standing exchange.',
    intro:'Hand fighting, ties and takedown connections form the center of this wrestling series. The published material moves from first contact through leg attacks, body locks and reactions.',
    fit:'Consider this course when the exchange on the feet is the part of grappling you want to study. Its organizing thread is standing wrestling, with several ways to enter and finish rather than a single takedown.',
    practice:'Use the volume list to separate entries, finishes and counters. A useful viewing question is where an exchange begins: at a collar tie, an underhook or behind the opponent. Bring the situations you want to practice to a coach who can help you select suitable drills.',
    comparison:'The seated course starts from guard and connects to wrestling attacks. This course begins with standing exchanges, making the two useful to compare when deciding where your current question starts.',
    related:['seated-sweeps-and-wrestle-ups','modernized-headquarters-passing']
  },
  'modernized-headquarters-passing': {
    short:'Modernized Headquarters Passing', category:'Guard passing', focus:'Connect your passing options.',
    intro:'Study several routes from headquarters, then follow their connections as the guard player reacts. The course combines passing instruction with two live rounds and separate breakdowns.',
    fit:'Choose this subject when you want to explore the decisions around headquarters passing. The curriculum offers several routes from the position, with live application grouped separately from the instructional sections.',
    practice:'Compare the instructional volumes with the live breakdowns. Watch for the starting position and the change that precedes a different passing route. The breakdown sections give you a place to revisit the exchange after watching the round itself.',
    comparison:'Pass It All centers the leg drag and its connected passes. Modernized Headquarters Passing uses headquarters as its organizing position and includes a separate volume of live rounds and analysis.',
    related:['leg-drag-system','precision-top-stuff']
  },
  'precision-top-stuff': {
    short:'Precision Top Stuff', category:'Top control', focus:'Keep studying after the pass.',
    intro:'Side control, mount and north south provide the starting points for this top game course. The curriculum follows positional movement and several connected submission options.',
    fit:'Explore this course if your main question comes after reaching a top position. Its two volumes group the material by positional area, making it straightforward to compare side control with mount and north south.',
    practice:'As you watch, keep track of the position before the submission. Note when a section changes from an attack to a transition, and use those distinctions to organize questions for your next coached session.',
    comparison:'Arm Bar It All follows one submission family across several positions. Precision Top Stuff covers a wider range of attacks while keeping the emphasis on top positions.',
    related:['arm-bar-it-all','modernized-headquarters-passing']
  },
  'butterfly-half-and-knee-shield': {
    short:'Butterfly Half & Knee Shield', category:'Guard attacks', focus:'Find offense from underneath.',
    intro:'This four volume course connects sweeps and attacks across butterfly half, knee shield and related guard positions. The topic list includes arm attacks, leg entries and routes through deep half and dogfight.',
    fit:'Choose this material when you want to study offense from half guard structures. Review the volume headings first: the coverage extends beyond one guard shape and includes both sweeps and submission options.',
    practice:'Identify the guard position at the beginning of a section before comparing its attacks. Butterfly half, knee shield and deep half create different starting situations. Keep those distinctions in your notes rather than treating every sweep as interchangeable.',
    comparison:'The seated course is organized around attacking standing and kneeling opponents from a seated position. This course puts half guard structures and their connected attacks at the center.',
    related:['seated-sweeps-and-wrestle-ups','arm-bar-it-all']
  },
  'seated-sweeps-and-wrestle-ups': {
    short:'Seated Sweeps & Wrestle Ups', category:'Seated guard', focus:'Connect guard to wrestling.',
    intro:'Follow seated guard offense against opponents who are standing or kneeling. The series brings together sweeps, grips, wrestling entries and the responses that connect them.',
    fit:'Consider this course if you want to study the decision to stay with a guard attack or come up into a wrestling exchange. The published sections distinguish opponent posture and include connections and counters.',
    practice:'Pay attention to whether the opponent is standing or kneeling in the section you are watching. Compare the entry with the finishing exchange, and note where a failed attempt leads into the next option.',
    comparison:'Precision Wrestling For Jiu Jitsu begins on the feet. This series starts seated and works toward sweeps and wrestling connections, so the starting position is the clearest way to choose between them.',
    related:['precision-wrestling-for-jiu-jitsu','butterfly-half-and-knee-shield']
  },
  'leg-drag-system': {
    short:'Pass It All: The Leg Drag System', category:'Guard passing', focus:'Make the leg drag your reference point.',
    intro:'Explore the leg drag position, reactions to guard recovery and routes into other passes. The two volumes connect the central passing position to back takes, front headlocks and other top game exchanges.',
    fit:'Choose this course when the leg drag is the position you want to examine in more detail. The curriculum includes control and counters as well as transitions, rather than presenting the pass as an isolated movement.',
    practice:'Distinguish holding the position from entering a new pass. As the topic list moves between guard recovery, back steps and connected passing routes, note which reaction each section addresses. Discuss suitable practice with your training partners and coach.',
    comparison:'Modernized Headquarters Passing organizes its material around headquarters and includes live round breakdowns. Pass It All puts the leg drag first, then follows connections to other passing positions.',
    related:['modernized-headquarters-passing','precision-top-stuff']
  }
};

export const generatedPages = [
  {route:'/instructionals', kind:'hub', title:'Shawn Melanson Jiu Jitsu Instructionals | Precision', description:'Explore seven Shawn Melanson BJJ Fanatics instructionals. Watch public previews, compare the curriculum and find wrestling, passing, guard and submission courses.'},
  ...courses.map(course => ({route:`/instructionals/${course.slug}`,kind:'course',course,
    title:`${courseNotes[course.slug].short} | Shawn Melanson`,
    description:`Explore ${courseNotes[course.slug].short} by Shawn Melanson. Watch a public ${course.freeSampleUrl ? 'sample' : 'preview'}, review the curriculum and find the full course on BJJ Fanatics.`})),
  {route:'/adult-no-gi-jiu-jitsu',kind:'adult',title:'Adult No Gi Jiu Jitsu Hudson, NH | Precision',description:'Adult no gi jiu jitsu in Hudson, New Hampshire, with black belt coaches Shawn Melanson and Alex West. Explore class times and arrange your first free class.'},
  {route:'/kids-jiu-jitsu',kind:'kids',title:'Kids Jiu Jitsu Ages 5 and Up Hudson, NH | Precision',description:'Kids no gi jiu jitsu for ages 5 and up in Hudson, New Hampshire. Classes Monday, Tuesday and Thursday. Contact Precision to arrange your child’s first free class.'},
  {route:'/first-class',kind:'first',title:'Your First Jiu Jitsu Class in Hudson, NH | Precision',description:'Plan your first free class at Precision Jiu Jitsu in Hudson, New Hampshire. Find what to wear, class times, directions and how to arrange a visit with the gym.'},
  {route:'/privacy',kind:'privacy',title:'Privacy | Precision Jiu Jitsu',description:'How Precision Jiu Jitsu handles class enquiries, public video players and links to BJJ Fanatics. Contact the gym with questions about your information.'}
];
export const sourcePages = [
  {source:'index.html',output:'index.html',route:'/'},
  {source:'shawn-melanson.html',output:'shawn-melanson.html',route:'/shawn-melanson'}
];
export const pages = [...sourcePages,...generatedPages.map(page=>({...page,output:`${page.route.slice(1)}.html`}))];
