/*
 * Educational content: body systems and parts, in French, Dutch and English.
 *
 * Every part id here must match a `data-part` id drawn in body-svg.js
 * (tests/index.html checks this). Texts are written for children aged ~6–11.
 */
(function (root) {
  'use strict';

  const SYSTEMS = [
    {
      id: 'skin', emoji: '🖐️', color: '#f0a868',
      name: { en: 'Skin & senses', fr: 'Peau et sens', nl: 'Huid en zintuigen' },
      desc: {
        en: 'Your skin protects your body, and your senses tell you what is happening around you.',
        fr: 'Ta peau protège ton corps et tes sens te disent ce qui se passe autour de toi.',
        nl: 'Je huid beschermt je lichaam en je zintuigen vertellen je wat er rondom je gebeurt.',
      },
    },
    {
      id: 'skeleton', emoji: '🦴', color: '#9aa5b1',
      name: { en: 'Skeleton', fr: 'Squelette', nl: 'Skelet' },
      desc: {
        en: '206 bones hold you up, protect your organs and help you move.',
        fr: '206 os te tiennent debout, protègent tes organes et t’aident à bouger.',
        nl: '206 botten houden je rechtop, beschermen je organen en helpen je bewegen.',
      },
    },
    {
      id: 'muscles', emoji: '💪', color: '#e2766b',
      name: { en: 'Muscles', fr: 'Muscles', nl: 'Spieren' },
      desc: {
        en: 'More than 600 muscles pull on your bones so you can move, jump and smile.',
        fr: 'Plus de 600 muscles tirent sur tes os pour que tu puisses bouger, sauter et sourire.',
        nl: 'Meer dan 600 spieren trekken aan je botten zodat je kunt bewegen, springen en lachen.',
      },
    },
    {
      id: 'nervous', emoji: '🧠', color: '#e9b400',
      name: { en: 'Brain & nerves', fr: 'Cerveau et nerfs', nl: 'Hersenen en zenuwen' },
      desc: {
        en: 'Your brain and nerves are the control centre and the message network of your body.',
        fr: 'Ton cerveau et tes nerfs sont le centre de commande et le réseau de messages de ton corps.',
        nl: 'Je hersenen en zenuwen zijn het controlecentrum en het berichtennetwerk van je lichaam.',
      },
    },
    {
      id: 'circulatory', emoji: '❤️', color: '#d62839',
      name: { en: 'Heart & blood', fr: 'Cœur et sang', nl: 'Hart en bloed' },
      desc: {
        en: 'Your heart pumps blood through tubes to bring oxygen and food to every part of you.',
        fr: 'Ton cœur pompe le sang dans des tuyaux pour apporter oxygène et nourriture à chaque partie de ton corps.',
        nl: 'Je hart pompt bloed door buizen om zuurstof en voeding naar elk deel van je lichaam te brengen.',
      },
    },
    {
      id: 'respiratory', emoji: '🫁', color: '#ec7fa0',
      name: { en: 'Breathing', fr: 'Respiration', nl: 'Ademhaling' },
      desc: {
        en: 'Breathing brings fresh oxygen into your body and takes away carbon dioxide.',
        fr: 'La respiration fait entrer l’oxygène dans ton corps et fait sortir le dioxyde de carbone.',
        nl: 'Ademen brengt verse zuurstof in je lichaam en voert koolstofdioxide af.',
      },
    },
    {
      id: 'digestive', emoji: '🍎', color: '#ef8f4c',
      name: { en: 'Digestion', fr: 'Digestion', nl: 'Spijsvertering' },
      desc: {
        en: 'Your digestive system turns food into energy and building blocks for your body.',
        fr: 'Ton système digestif transforme la nourriture en énergie et en briques pour construire ton corps.',
        nl: 'Je spijsverteringsstelsel verandert eten in energie en bouwstenen voor je lichaam.',
      },
    },
    {
      id: 'urinary', emoji: '💧', color: '#8e6cc7',
      name: { en: 'Kidneys & bladder', fr: 'Reins et vessie', nl: 'Nieren en blaas' },
      desc: {
        en: 'Your kidneys clean your blood, and your bladder stores the waste water as pee.',
        fr: 'Tes reins nettoient ton sang et ta vessie garde l’eau sale sous forme de pipi.',
        nl: 'Je nieren maken je bloed schoon en je blaas bewaart het afvalwater als plas.',
      },
    },
  ];

  // Each part: { system, en: { name, info, fact }, fr: {...}, nl: {...} }
  const PARTS = {
    /* ───────────── Skin & senses ───────────── */
    skin: {
      system: 'skin',
      en: {
        name: 'Skin',
        info: 'Skin covers your whole body like a stretchy coat. It keeps germs out, keeps water in and lets you feel hot, cold and soft things.',
        fact: 'Skin is your biggest organ! Every day you lose tiny flakes of old skin, and new skin grows underneath.',
      },
      fr: {
        name: 'La peau',
        info: 'La peau recouvre tout ton corps comme un manteau élastique. Elle empêche les microbes d’entrer, garde l’eau à l’intérieur et te permet de sentir le chaud, le froid et le doux.',
        fact: 'La peau est ton plus grand organe ! Chaque jour, tu perds de minuscules peaux mortes et une nouvelle peau pousse en dessous.',
      },
      nl: {
        name: 'De huid',
        info: 'Je huid bedekt je hele lichaam als een rekbare jas. Ze houdt bacteriën buiten, houdt water binnen en laat je warm, koud en zacht voelen.',
        fact: 'Je huid is je grootste orgaan! Elke dag verlies je piepkleine schilfertjes oude huid en groeit er nieuwe huid onder.',
      },
    },
    hair: {
      system: 'skin',
      en: {
        name: 'Hair',
        info: 'Hair grows from tiny pockets in your skin called follicles. The hair on your head keeps it warm and protects it from the sun.',
        fact: 'You have about 100,000 hairs on your head and lose 50 to 100 of them every day. Don’t worry, they grow back!',
      },
      fr: {
        name: 'Les cheveux',
        info: 'Les cheveux poussent dans de petites poches de la peau appelées follicules. Ils gardent ta tête au chaud et la protègent du soleil.',
        fact: 'Tu as environ 100 000 cheveux sur la tête et tu en perds 50 à 100 par jour. Pas de panique, ils repoussent !',
      },
      nl: {
        name: 'Het haar',
        info: 'Haren groeien uit kleine zakjes in je huid, haarzakjes genoemd. Het haar op je hoofd houdt het warm en beschermt het tegen de zon.',
        fact: 'Je hebt ongeveer 100.000 haren op je hoofd en je verliest er elke dag 50 tot 100. Geen zorgen, ze groeien weer aan!',
      },
    },
    eyes: {
      system: 'skin',
      en: {
        name: 'Eyes',
        info: 'Your eyes catch light and turn it into messages for your brain, so you can see colours, shapes and movement. Eyelids and eyelashes protect them from dust.',
        fact: 'You blink 15 to 20 times a minute. That’s more than 10,000 times a day!',
      },
      fr: {
        name: 'Les yeux',
        info: 'Tes yeux captent la lumière et la transforment en messages pour ton cerveau : c’est comme ça que tu vois les couleurs, les formes et les mouvements. Les paupières et les cils les protègent de la poussière.',
        fact: 'Tu clignes des yeux 15 à 20 fois par minute : plus de 10 000 fois par jour !',
      },
      nl: {
        name: 'De ogen',
        info: 'Je ogen vangen licht op en zetten het om in berichtjes voor je hersenen. Zo zie je kleuren, vormen en beweging. Oogleden en wimpers beschermen ze tegen stof.',
        fact: 'Je knippert 15 tot 20 keer per minuut met je ogen: dat is meer dan 10.000 keer per dag!',
      },
    },
    ears: {
      system: 'skin',
      en: {
        name: 'Ears',
        info: 'Your ears collect sounds and send them deep inside your head, where tiny parts turn them into signals for your brain. Your inner ear also helps you keep your balance.',
        fact: 'The smallest bone in your body, the stirrup, is inside your ear. It is smaller than a grain of rice!',
      },
      fr: {
        name: 'Les oreilles',
        info: 'Tes oreilles attrapent les sons et les envoient au fond de ta tête, où de toutes petites pièces les transforment en signaux pour le cerveau. L’oreille interne t’aide aussi à garder l’équilibre.',
        fact: 'Le plus petit os de ton corps, l’étrier, se trouve dans ton oreille. Il est plus petit qu’un grain de riz !',
      },
      nl: {
        name: 'De oren',
        info: 'Je oren vangen geluiden op en sturen ze diep in je hoofd, waar piepkleine onderdelen ze omzetten in signalen voor je hersenen. Je binnenoor helpt je ook om je evenwicht te bewaren.',
        fact: 'Het kleinste botje van je lichaam, de stijgbeugel, zit in je oor. Het is kleiner dan een rijstkorrel!',
      },
    },
    nose: {
      system: 'skin',
      en: {
        name: 'Nose',
        info: 'Your nose lets you smell. It also warms and cleans the air you breathe: little hairs and sticky mucus catch dust and germs.',
        fact: 'Your nose can recognise thousands of different smells, and smelling helps you taste your food too!',
      },
      fr: {
        name: 'Le nez',
        info: 'Ton nez te permet de sentir les odeurs. Il réchauffe et nettoie aussi l’air que tu respires : des petits poils et du mucus collant attrapent la poussière et les microbes.',
        fact: 'Ton nez peut reconnaître des milliers d’odeurs différentes, et l’odorat t’aide aussi à goûter ce que tu manges !',
      },
      nl: {
        name: 'De neus',
        info: 'Met je neus kun je ruiken. Hij verwarmt en reinigt ook de lucht die je inademt: kleine haartjes en kleverig slijm vangen stof en bacteriën.',
        fact: 'Je neus kan duizenden verschillende geuren herkennen, en ruiken helpt je ook om je eten te proeven!',
      },
    },
    mouth: {
      system: 'skin',
      en: {
        name: 'Mouth & tongue',
        info: 'Digestion starts in your mouth: your teeth chew food and your tongue mixes it with saliva. Your tongue is covered with taste buds for sweet, salty, sour, bitter and savoury flavours.',
        fact: 'You have thousands of taste buds, and they are replaced about every two weeks!',
      },
      fr: {
        name: 'La bouche et la langue',
        info: 'C’est dans ta bouche que commence la digestion : tes dents mâchent les aliments et ta langue les mélange avec la salive. Ta langue est couverte de papilles qui goûtent le sucré, le salé, l’acide, l’amer et l’umami.',
        fact: 'Tu as des milliers de papilles gustatives, et elles se renouvellent environ toutes les deux semaines !',
      },
      nl: {
        name: 'Mond en tong',
        info: 'In je mond begint de spijsvertering: je tanden kauwen het eten en je tong mengt het met speeksel. Je tong zit vol smaakpapillen voor zoet, zout, zuur, bitter en umami.',
        fact: 'Je hebt duizenden smaakpapillen, en ze worden ongeveer om de twee weken vernieuwd!',
      },
    },

    /* ───────────── Skeleton ───────────── */
    skull: {
      system: 'skeleton',
      en: {
        name: 'Skull',
        info: 'Your skull is a strong helmet made of bones that protects your brain. Your lower jaw is the only bone of the skull that can move.',
        fact: 'A baby’s skull has soft spots so it can grow. The bones join together as the child gets older.',
      },
      fr: {
        name: 'Le crâne',
        info: 'Ton crâne est un casque solide fait d’os qui protège ton cerveau. La mâchoire inférieure est le seul os du crâne qui peut bouger.',
        fact: 'Le crâne d’un bébé a des zones molles, les fontanelles, pour pouvoir grandir. Les os se soudent ensuite petit à petit.',
      },
      nl: {
        name: 'De schedel',
        info: 'Je schedel is een stevige helm van botten die je hersenen beschermt. Je onderkaak is het enige bot van je schedel dat kan bewegen.',
        fact: 'De schedel van een baby heeft zachte plekjes, de fontanellen, zodat hij kan groeien. Later groeien de botten aan elkaar.',
      },
    },
    spine: {
      system: 'skeleton',
      en: {
        name: 'Spine',
        info: 'Your spine (backbone) is a stack of 33 small bones called vertebrae. It holds you upright, lets you bend and protects the spinal cord inside.',
        fact: 'You are about 1 cm taller in the morning than in the evening, because the cushions between your vertebrae get squeezed during the day!',
      },
      fr: {
        name: 'La colonne vertébrale',
        info: 'Ta colonne vertébrale est une pile de 33 petits os appelés vertèbres. Elle te tient droit, te permet de te pencher et protège la moelle épinière à l’intérieur.',
        fact: 'Le matin, tu mesures environ 1 cm de plus que le soir, car les petits coussins entre tes vertèbres s’écrasent pendant la journée !',
      },
      nl: {
        name: 'De wervelkolom',
        info: 'Je wervelkolom (ruggengraat) is een stapel van 33 kleine botjes, de wervels. Ze houdt je rechtop, laat je buigen en beschermt het ruggenmerg dat erin zit.',
        fact: '’s Ochtends ben je ongeveer 1 cm groter dan ’s avonds, omdat de kussentjes tussen je wervels overdag worden samengedrukt!',
      },
    },
    ribs: {
      system: 'skeleton',
      en: {
        name: 'Rib cage',
        info: 'You have 12 pairs of ribs that form a cage around your heart and lungs. Your rib cage moves up and out every time you breathe in.',
        fact: 'Your ribs move in and out about 20,000 times a day while you breathe!',
      },
      fr: {
        name: 'La cage thoracique',
        info: 'Tu as 12 paires de côtes qui forment une cage autour de ton cœur et de tes poumons. Elle se soulève chaque fois que tu inspires.',
        fact: 'Tes côtes bougent environ 20 000 fois par jour pendant que tu respires !',
      },
      nl: {
        name: 'De ribbenkast',
        info: 'Je hebt 12 paar ribben die een kooi vormen rond je hart en longen. Je ribbenkast gaat omhoog en naar buiten telkens als je inademt.',
        fact: 'Je ribben bewegen ongeveer 20.000 keer per dag terwijl je ademt!',
      },
    },
    collarbone: {
      system: 'skeleton',
      en: {
        name: 'Collarbone',
        info: 'The collarbone (clavicle) connects your arm to your body, like a little bridge between your shoulder and your breastbone.',
        fact: 'The collarbone is one of the first bones to form in a baby, and one of the last to finish growing, around the age of 25!',
      },
      fr: {
        name: 'La clavicule',
        info: 'La clavicule relie ton bras au reste du corps, comme un petit pont entre ton épaule et ton sternum.',
        fact: 'La clavicule est l’un des premiers os à se former chez le bébé… et l’un des derniers à finir de grandir, vers 25 ans !',
      },
      nl: {
        name: 'Het sleutelbeen',
        info: 'Het sleutelbeen verbindt je arm met je lichaam, als een klein bruggetje tussen je schouder en je borstbeen.',
        fact: 'Het sleutelbeen is een van de eerste botten die zich bij een baby vormen… en een van de laatste die klaar zijn met groeien, rond je 25ste!',
      },
    },
    humerus: {
      system: 'skeleton',
      en: {
        name: 'Upper arm bone',
        info: 'The humerus goes from your shoulder to your elbow. Strong muscles attached to it let you lift, throw and hug.',
        fact: 'When you bump your elbow and it tingles, it isn’t the bone that hurts: it’s a nerve that runs just under the skin there!',
      },
      fr: {
        name: 'L’humérus',
        info: 'L’humérus va de ton épaule à ton coude. Des muscles puissants s’y attachent pour te permettre de soulever, lancer et faire des câlins.',
        fact: 'Quand tu te cognes le coude et que ça picote, ce n’est pas l’os qui fait mal : c’est un nerf qui passe juste sous la peau !',
      },
      nl: {
        name: 'Het opperarmbeen',
        info: 'Het opperarmbeen loopt van je schouder tot je elleboog. Sterke spieren zitten eraan vast zodat je kunt tillen, gooien en knuffelen.',
        fact: 'Als je je elleboog stoot en het tintelt, is dat niet het bot: het is een zenuw die daar vlak onder je huid loopt. Dat plekje heet het weduwnaarsbotje!',
      },
    },
    forearm: {
      system: 'skeleton',
      en: {
        name: 'Forearm bones',
        info: 'Your forearm has two bones: the radius and the ulna. They can twist around each other so you can turn your hand palm-up or palm-down.',
        fact: 'Try it: turn your hand over and watch your forearm. The radius crosses over the ulna!',
      },
      fr: {
        name: 'Le radius et le cubitus',
        info: 'Ton avant-bras a deux os : le radius et le cubitus. Ils peuvent tourner l’un autour de l’autre pour que ta main se retourne, paume vers le haut ou vers le bas.',
        fact: 'Essaie : retourne ta main et regarde ton avant-bras. Le radius croise le cubitus !',
      },
      nl: {
        name: 'Spaakbeen en ellepijp',
        info: 'Je onderarm heeft twee botten: het spaakbeen en de ellepijp. Ze kunnen om elkaar draaien, zodat je je hand kunt omdraaien.',
        fact: 'Probeer maar: draai je hand om en kijk naar je onderarm. Het spaakbeen kruist dan over de ellepijp!',
      },
    },
    hand: {
      system: 'skeleton',
      en: {
        name: 'Hand bones',
        info: 'Each hand and wrist has 27 bones! All these small bones make your hands very flexible, so you can write, draw and build.',
        fact: 'Your two hands together have 54 bones: about a quarter of all the bones in your body!',
      },
      fr: {
        name: 'Les os de la main',
        info: 'Chaque main (avec le poignet) compte 27 os ! Tous ces petits os rendent tes mains très souples pour écrire, dessiner et construire.',
        fact: 'Tes deux mains contiennent 54 os, environ un quart de tous les os de ton corps !',
      },
      nl: {
        name: 'De handbotjes',
        info: 'Elke hand (met de pols) heeft 27 botjes! Al die kleine botjes maken je handen heel beweeglijk, zodat je kunt schrijven, tekenen en bouwen.',
        fact: 'Je twee handen samen hebben 54 botjes, ongeveer een kwart van alle botten in je lichaam!',
      },
    },
    pelvis: {
      system: 'skeleton',
      en: {
        name: 'Pelvis',
        info: 'The pelvis is a big bowl-shaped bone at your hips. It connects your spine to your legs and holds organs like your bladder.',
        fact: 'When you sit down, you sit on two bumps of your pelvis called the sitting bones!',
      },
      fr: {
        name: 'Le bassin',
        info: 'Le bassin est un grand os en forme de bol au niveau des hanches. Il relie ta colonne vertébrale à tes jambes et soutient des organes comme la vessie.',
        fact: 'Quand tu t’assois, tu t’appuies sur deux bosses du bassin : les ischions !',
      },
      nl: {
        name: 'Het bekken',
        info: 'Het bekken is een groot, komvormig bot ter hoogte van je heupen. Het verbindt je wervelkolom met je benen en ondersteunt organen zoals je blaas.',
        fact: 'Als je zit, rust je op twee bultjes van je bekken: de zitbeenknobbels!',
      },
    },
    femur: {
      system: 'skeleton',
      en: {
        name: 'Thigh bone',
        info: 'The femur is the longest and strongest bone in your body. It goes from your hip to your knee.',
        fact: 'Your femur is about a quarter of your height!',
      },
      fr: {
        name: 'Le fémur',
        info: 'Le fémur est l’os le plus long et le plus solide de ton corps. Il va de ta hanche à ton genou.',
        fact: 'Ton fémur mesure environ un quart de ta taille !',
      },
      nl: {
        name: 'Het dijbeen',
        info: 'Het dijbeen is het langste en sterkste bot van je lichaam. Het loopt van je heup tot je knie.',
        fact: 'Je dijbeen is ongeveer een kwart zo lang als jij!',
      },
    },
    kneecap: {
      system: 'skeleton',
      en: {
        name: 'Kneecap',
        info: 'The kneecap (patella) is a small round bone that protects the front of your knee and helps your thigh muscles straighten your leg.',
        fact: 'Babies are born with kneecaps made of soft cartilage. They slowly turn into bone between the ages of about 3 and 5.',
      },
      fr: {
        name: 'La rotule',
        info: 'La rotule est un petit os rond qui protège l’avant du genou et aide les muscles de la cuisse à tendre la jambe.',
        fact: 'Les bébés naissent avec des rotules en cartilage mou. Elles deviennent de l’os petit à petit, vers 3 à 5 ans.',
      },
      nl: {
        name: 'De knieschijf',
        info: 'De knieschijf is een klein, rond bot dat de voorkant van je knie beschermt en je dijspieren helpt om je been te strekken.',
        fact: 'Baby’s worden geboren met knieschijven van zacht kraakbeen. Pas tussen ongeveer 3 en 5 jaar worden ze echt bot.',
      },
    },
    shin: {
      system: 'skeleton',
      en: {
        name: 'Shin bones',
        info: 'Your lower leg has two bones: the big tibia (shin bone) carries your weight, and the thin fibula helps keep your ankle steady.',
        fact: 'You can feel your tibia just under the skin at the front of your leg. That’s why bumping your shin hurts so much!',
      },
      fr: {
        name: 'Le tibia et le péroné',
        info: 'Ta jambe a deux os : le gros tibia porte ton poids, et le fin péroné aide ta cheville à rester stable.',
        fact: 'Ton tibia est juste sous la peau à l’avant de la jambe : c’est pour ça qu’un coup dans le tibia fait si mal !',
      },
      nl: {
        name: 'Scheenbeen en kuitbeen',
        info: 'Je onderbeen heeft twee botten: het grote scheenbeen draagt je gewicht en het dunne kuitbeen houdt je enkel stevig.',
        fact: 'Je voelt je scheenbeen vlak onder de huid aan de voorkant van je been. Daarom doet een stoot tegen je scheen zo’n pijn!',
      },
    },
    foot: {
      system: 'skeleton',
      en: {
        name: 'Foot bones',
        info: 'Each foot has 26 bones that form a springy arch. They help you stand, walk, run and jump.',
        fact: 'When you run, your feet carry two to three times your weight with every step!',
      },
      fr: {
        name: 'Les os du pied',
        info: 'Chaque pied a 26 os qui forment une voûte souple, comme un ressort. Ils t’aident à te tenir debout, marcher, courir et sauter.',
        fact: 'Quand tu cours, tes pieds portent deux à trois fois ton poids à chaque pas !',
      },
      nl: {
        name: 'De voetbotjes',
        info: 'Elke voet heeft 26 botjes die samen een verende boog vormen. Ze helpen je staan, wandelen, rennen en springen.',
        fact: 'Als je rent, dragen je voeten bij elke stap twee tot drie keer je gewicht!',
      },
    },

    /* ───────────── Muscles ───────────── */
    deltoid: {
      system: 'muscles',
      en: {
        name: 'Shoulder muscle',
        info: 'The deltoid is the round muscle on top of your shoulder. It lifts your arm, so you can wave hello or put your hand up in class.',
        fact: 'Its name comes from the Greek letter delta (Δ), because it is shaped like a triangle!',
      },
      fr: {
        name: 'Le deltoïde',
        info: 'Le deltoïde est le muscle arrondi sur ton épaule. Il lève ton bras pour dire bonjour ou lever la main en classe.',
        fact: 'Son nom vient de la lettre grecque delta (Δ), parce qu’il a la forme d’un triangle !',
      },
      nl: {
        name: 'De deltaspier',
        info: 'De deltaspier is de ronde spier bovenop je schouder. Ze tilt je arm op, zodat je kunt zwaaien of je vinger opsteken in de klas.',
        fact: 'De naam komt van de Griekse letter delta (Δ), omdat de spier de vorm van een driehoek heeft!',
      },
    },
    pectoral: {
      system: 'muscles',
      en: {
        name: 'Chest muscle',
        info: 'The pectoral muscles cover the front of your chest. They pull your arms forward, like when you push a door or give someone a hug.',
        fact: 'Push-ups make your chest muscles work really hard!',
      },
      fr: {
        name: 'Les pectoraux',
        info: 'Les pectoraux recouvrent l’avant de ta poitrine. Ils tirent tes bras vers l’avant, comme quand tu pousses une porte ou que tu fais un câlin.',
        fact: 'Les pompes font travailler très fort tes pectoraux !',
      },
      nl: {
        name: 'De borstspier',
        info: 'De borstspieren bedekken de voorkant van je borst. Ze trekken je armen naar voren, zoals wanneer je een deur openduwt of iemand knuffelt.',
        fact: 'Bij opdrukken werken je borstspieren extra hard!',
      },
    },
    biceps: {
      system: 'muscles',
      en: {
        name: 'Biceps',
        info: 'The biceps is on the front of your upper arm. When it gets shorter, it bends your elbow. It’s the muscle you show off when you flex!',
        fact: 'Muscles can only pull, never push. That’s why you need the triceps, at the back of your arm, to straighten it again.',
      },
      fr: {
        name: 'Le biceps',
        info: 'Le biceps se trouve à l’avant du bras. Quand il se raccourcit, il plie ton coude : c’est lui que tu montres quand tu fais voir tes muscles !',
        fact: 'Les muscles peuvent seulement tirer, jamais pousser. C’est pour ça que le triceps, à l’arrière du bras, sert à déplier le bras.',
      },
      nl: {
        name: 'De biceps',
        info: 'De biceps zit aan de voorkant van je bovenarm. Als hij korter wordt, buigt je elleboog. Dat is de spier die je toont als je je spierballen laat zien!',
        fact: 'Spieren kunnen alleen trekken, nooit duwen. Daarom heb je de triceps aan de achterkant van je arm nodig om hem weer te strekken.',
      },
    },
    forearmMuscles: {
      system: 'muscles',
      en: {
        name: 'Forearm muscles',
        info: 'About twenty muscles in your forearm move your wrist and fingers. They are connected to your fingers by long, strong cords called tendons.',
        fact: 'There are no muscles inside your fingers! They move like puppets, pulled by tendons from your forearm and hand.',
      },
      fr: {
        name: 'Les muscles de l’avant-bras',
        info: 'Une vingtaine de muscles de l’avant-bras bougent ton poignet et tes doigts. Ils sont reliés aux doigts par de longs cordons solides : les tendons.',
        fact: 'Il n’y a pas de muscles dans tes doigts ! Ils bougent comme des marionnettes, tirés par des tendons venant de l’avant-bras et de la main.',
      },
      nl: {
        name: 'De onderarmspieren',
        info: 'Ongeveer twintig spieren in je onderarm bewegen je pols en vingers. Ze zitten aan je vingers vast met lange, sterke koorden: de pezen.',
        fact: 'Er zitten geen spieren in je vingers! Ze bewegen als marionetten, getrokken door pezen vanuit je onderarm en hand.',
      },
    },
    abs: {
      system: 'muscles',
      en: {
        name: 'Belly muscles',
        info: 'Your abdominal muscles (“abs”) make a strong wall that protects your belly and holds your organs in place. They help you sit up, twist and keep your balance.',
        fact: 'You use your belly muscles when you laugh, cough or sneeze!',
      },
      fr: {
        name: 'Les abdominaux',
        info: 'Les abdominaux forment un mur solide qui protège ton ventre et garde tes organes en place. Ils t’aident à te redresser, à tourner et à garder l’équilibre.',
        fact: 'Tu utilises tes abdominaux quand tu ris, tousses ou éternues !',
      },
      nl: {
        name: 'De buikspieren',
        info: 'Je buikspieren vormen een stevige muur die je buik beschermt en je organen op hun plaats houdt. Ze helpen je rechtop te komen, te draaien en in evenwicht te blijven.',
        fact: 'Je gebruikt je buikspieren als je lacht, hoest of niest!',
      },
    },
    quadriceps: {
      system: 'muscles',
      en: {
        name: 'Thigh muscles',
        info: 'The quadriceps is a group of four muscles at the front of your thigh. They straighten your knee when you kick a ball, climb stairs or jump.',
        fact: '“Quad” means four, just like the four muscles in the group!',
      },
      fr: {
        name: 'Le quadriceps',
        info: 'Le quadriceps est un groupe de quatre muscles à l’avant de la cuisse. Il tend ton genou quand tu tapes dans un ballon, montes les escaliers ou sautes.',
        fact: '« Quadri » veut dire quatre, comme les quatre muscles du groupe !',
      },
      nl: {
        name: 'De quadriceps',
        info: 'De quadriceps is een groep van vier spieren aan de voorkant van je dij. Ze strekken je knie als je tegen een bal trapt, de trap op gaat of springt.',
        fact: '“Quadri” betekent vier, net als de vier spieren in de groep!',
      },
    },
    calf: {
      system: 'muscles',
      en: {
        name: 'Lower leg muscles',
        info: 'Muscles in your lower leg move your foot and toes. The calf muscles at the back lift your heel so you can stand on tiptoe and push off when you run.',
        fact: 'Your calf muscles are attached to your heel by the Achilles tendon, the strongest tendon in your body!',
      },
      fr: {
        name: 'Les muscles de la jambe',
        info: 'Les muscles du bas de la jambe bougent ton pied et tes orteils. Les mollets, à l’arrière, soulèvent ton talon pour te mettre sur la pointe des pieds et t’élancer quand tu cours.',
        fact: 'Tes mollets sont reliés au talon par le tendon d’Achille, le tendon le plus solide du corps !',
      },
      nl: {
        name: 'De onderbeenspieren',
        info: 'De spieren in je onderbeen bewegen je voet en tenen. De kuitspieren aan de achterkant tillen je hiel op, zodat je op je tenen kunt staan en kunt afzetten als je rent.',
        fact: 'Je kuitspieren zitten aan je hiel vast met de achillespees, de sterkste pees van je lichaam!',
      },
    },

    /* ───────────── Brain & nerves ───────────── */
    brain: {
      system: 'nervous',
      en: {
        name: 'Brain',
        info: 'Your brain is the boss of your body. It thinks, learns, remembers, feels emotions and controls everything you do, even while you sleep!',
        fact: 'Your brain has about 86 billion nerve cells that send messages to each other all the time.',
      },
      fr: {
        name: 'Le cerveau',
        info: 'Ton cerveau est le chef de ton corps. Il pense, apprend, se souvient, ressent les émotions et contrôle tout ce que tu fais… même quand tu dors !',
        fact: 'Ton cerveau contient environ 86 milliards de cellules nerveuses qui s’envoient des messages en permanence.',
      },
      nl: {
        name: 'De hersenen',
        info: 'Je hersenen zijn de baas van je lichaam. Ze denken, leren, onthouden, voelen emoties en sturen alles wat je doet, zelfs als je slaapt!',
        fact: 'Je hersenen hebben ongeveer 86 miljard zenuwcellen die voortdurend berichtjes naar elkaar sturen.',
      },
    },
    spinalCord: {
      system: 'nervous',
      en: {
        name: 'Spinal cord',
        info: 'The spinal cord is a thick bundle of nerves that runs down inside your spine. It’s like a motorway carrying messages between your brain and your body.',
        fact: 'Some reflexes, like pulling your hand away from something hot, are handled by your spinal cord before your brain even knows!',
      },
      fr: {
        name: 'La moelle épinière',
        info: 'La moelle épinière est un gros cordon de nerfs qui descend à l’intérieur de ta colonne vertébrale. C’est comme une autoroute qui transporte les messages entre ton cerveau et ton corps.',
        fact: 'Certains réflexes, comme retirer ta main de quelque chose de brûlant, sont gérés par la moelle épinière avant même que ton cerveau le sache !',
      },
      nl: {
        name: 'Het ruggenmerg',
        info: 'Het ruggenmerg is een dikke bundel zenuwen binnenin je wervelkolom. Het is als een snelweg die berichten vervoert tussen je hersenen en je lichaam.',
        fact: 'Sommige reflexen, zoals je hand terugtrekken van iets heets, regelt je ruggenmerg nog voor je hersenen het weten!',
      },
    },
    nerves: {
      system: 'nervous',
      en: {
        name: 'Nerves',
        info: 'Nerves are like wires that reach every part of your body. They carry messages to your brain about what you touch and feel, and bring orders back to your muscles.',
        fact: 'Some nerve messages travel at more than 100 metres per second, faster than a racing car!',
      },
      fr: {
        name: 'Les nerfs',
        info: 'Les nerfs sont comme des câbles qui vont dans tout le corps. Ils apportent au cerveau des messages sur ce que tu touches et ressens, et transmettent ses ordres aux muscles.',
        fact: 'Certains messages nerveux voyagent à plus de 100 mètres par seconde : plus vite qu’une voiture de course !',
      },
      nl: {
        name: 'De zenuwen',
        info: 'Zenuwen zijn als draden die naar elk deel van je lichaam gaan. Ze brengen berichten naar je hersenen over wat je aanraakt en voelt, en brengen bevelen terug naar je spieren.',
        fact: 'Sommige zenuwberichten gaan sneller dan 100 meter per seconde, sneller dan een raceauto!',
      },
    },

    /* ───────────── Heart & blood ───────────── */
    heart: {
      system: 'circulatory',
      en: {
        name: 'Heart',
        info: 'Your heart is a strong muscle about the size of your fist. It pumps blood around your whole body, day and night, without ever taking a break.',
        fact: 'A child’s heart beats more than 100,000 times a day!',
      },
      fr: {
        name: 'Le cœur',
        info: 'Ton cœur est un muscle puissant, à peu près de la taille de ton poing. Il pompe le sang dans tout le corps, jour et nuit, sans jamais faire de pause.',
        fact: 'Le cœur d’un enfant bat plus de 100 000 fois par jour !',
      },
      nl: {
        name: 'Het hart',
        info: 'Je hart is een sterke spier, ongeveer zo groot als je vuist. Het pompt bloed door je hele lichaam, dag en nacht, zonder ooit te pauzeren.',
        fact: 'Het hart van een kind klopt meer dan 100.000 keer per dag!',
      },
    },
    arteries: {
      system: 'circulatory',
      en: {
        name: 'Arteries',
        info: 'Arteries are tubes that carry blood away from your heart. This blood is full of oxygen and food for all your cells.',
        fact: 'You can feel your arteries working: put two fingers on your wrist or neck to feel your pulse!',
      },
      fr: {
        name: 'Les artères',
        info: 'Les artères sont des tuyaux qui transportent le sang du cœur vers tout le corps. Ce sang est rempli d’oxygène et de nourriture pour toutes tes cellules.',
        fact: 'Tu peux sentir tes artères travailler : pose deux doigts sur ton poignet ou ton cou pour sentir ton pouls !',
      },
      nl: {
        name: 'De slagaders',
        info: 'Slagaders zijn buizen die bloed van je hart wegvoeren. Dat bloed zit vol zuurstof en voedingsstoffen voor al je cellen.',
        fact: 'Je kunt je slagaders voelen werken: leg twee vingers op je pols of je hals en voel je hartslag!',
      },
    },
    veins: {
      system: 'circulatory',
      en: {
        name: 'Veins',
        info: 'Veins carry blood back to your heart after it has delivered its oxygen. Little valves inside stop the blood from flowing backwards.',
        fact: 'The blood in your veins isn’t really blue, it’s dark red! Veins only look blue through your skin.',
      },
      fr: {
        name: 'Les veines',
        info: 'Les veines ramènent le sang vers le cœur après qu’il a livré son oxygène. De petites valves à l’intérieur l’empêchent de repartir en arrière.',
        fact: 'Le sang des veines n’est pas vraiment bleu, il est rouge foncé ! Les veines paraissent seulement bleues à travers la peau.',
      },
      nl: {
        name: 'De aders',
        info: 'Aders brengen het bloed terug naar je hart nadat het zijn zuurstof heeft afgeleverd. Kleine klepjes binnenin zorgen dat het bloed niet terugstroomt.',
        fact: 'Het bloed in je aders is niet echt blauw, maar donkerrood! Aders lijken alleen blauw door je huid heen.',
      },
    },

    /* ───────────── Breathing ───────────── */
    trachea: {
      system: 'respiratory',
      en: {
        name: 'Windpipe',
        info: 'The windpipe (trachea) is the tube that carries air from your nose and mouth down to your lungs. Rings of cartilage keep it open, like a vacuum-cleaner hose.',
        fact: 'A little flap called the epiglottis closes your windpipe when you swallow, so food goes the right way!',
      },
      fr: {
        name: 'La trachée',
        info: 'La trachée est le tuyau qui amène l’air de ton nez et de ta bouche jusqu’aux poumons. Des anneaux de cartilage la gardent ouverte, comme le tuyau d’un aspirateur.',
        fact: 'Un petit clapet, l’épiglotte, ferme la trachée quand tu avales, pour que la nourriture prenne le bon chemin !',
      },
      nl: {
        name: 'De luchtpijp',
        info: 'De luchtpijp is de buis die lucht van je neus en mond naar je longen brengt. Ringen van kraakbeen houden hem open, zoals de slang van een stofzuiger.',
        fact: 'Een klein klepje, het strotklepje, sluit je luchtpijp als je slikt, zodat je eten de juiste weg neemt!',
      },
    },
    lungs: {
      system: 'respiratory',
      en: {
        name: 'Lungs',
        info: 'Your two lungs are like big sponges. When you breathe in, they fill with air and pass oxygen into your blood. When you breathe out, they get rid of carbon dioxide.',
        fact: 'Your left lung is a little smaller than your right one, to make room for your heart!',
      },
      fr: {
        name: 'Les poumons',
        info: 'Tes deux poumons sont comme de grosses éponges. Quand tu inspires, ils se remplissent d’air et font passer l’oxygène dans le sang. Quand tu expires, ils rejettent le dioxyde de carbone.',
        fact: 'Ton poumon gauche est un peu plus petit que le droit, pour laisser de la place à ton cœur !',
      },
      nl: {
        name: 'De longen',
        info: 'Je twee longen zijn als grote sponzen. Als je inademt, vullen ze zich met lucht en geven ze zuurstof aan je bloed. Als je uitademt, raken ze koolstofdioxide kwijt.',
        fact: 'Je linkerlong is een beetje kleiner dan je rechterlong, om plaats te maken voor je hart!',
      },
    },
    diaphragm: {
      system: 'respiratory',
      en: {
        name: 'Diaphragm',
        info: 'The diaphragm is a dome-shaped muscle under your lungs. When it pulls down, air rushes into your lungs. When it relaxes, the air goes out again.',
        fact: 'Hiccups happen when your diaphragm suddenly twitches. The “hic” sound comes from your vocal cords snapping shut!',
      },
      fr: {
        name: 'Le diaphragme',
        info: 'Le diaphragme est un muscle en forme de dôme sous tes poumons. Quand il descend, l’air entre dans les poumons. Quand il se relâche, l’air ressort.',
        fact: 'Le hoquet, c’est ton diaphragme qui se contracte d’un coup. Le « hic » vient de tes cordes vocales qui se ferment brusquement !',
      },
      nl: {
        name: 'Het middenrif',
        info: 'Het middenrif is een koepelvormige spier onder je longen. Als het naar beneden trekt, stroomt er lucht in je longen. Als het ontspant, gaat de lucht weer naar buiten.',
        fact: 'De hik krijg je als je middenrif plots samentrekt. Het “hik”-geluid komt van je stembanden die snel dichtklappen!',
      },
    },

    /* ───────────── Digestion ───────────── */
    esophagus: {
      system: 'digestive',
      en: {
        name: 'Food pipe',
        info: 'The esophagus is a muscular tube that carries food from your mouth to your stomach. Its muscles squeeze the food down in waves.',
        fact: 'Thanks to those muscle waves, you could even swallow upside down! (But please don’t try it.)',
      },
      fr: {
        name: 'L’œsophage',
        info: 'L’œsophage est un tuyau musclé qui transporte la nourriture de ta bouche jusqu’à l’estomac. Ses muscles poussent les aliments vers le bas, par vagues.',
        fact: 'Grâce à ces vagues, tu pourrais même avaler la tête en bas ! (Mais n’essaie pas.)',
      },
      nl: {
        name: 'De slokdarm',
        info: 'De slokdarm is een gespierde buis die eten van je mond naar je maag brengt. Zijn spieren duwen het eten in golven naar beneden.',
        fact: 'Dankzij die golven zou je zelfs ondersteboven kunnen slikken! (Maar probeer het liever niet.)',
      },
    },
    stomach: {
      system: 'digestive',
      en: {
        name: 'Stomach',
        info: 'Your stomach is a stretchy bag that mixes food with strong juices until it becomes a kind of thick soup. Food stays there for a few hours.',
        fact: 'Your stomach acid is so strong that your stomach protects itself with a layer of slimy mucus!',
      },
      fr: {
        name: 'L’estomac',
        info: 'Ton estomac est une poche élastique qui mélange les aliments avec des sucs puissants pour en faire une sorte de soupe épaisse. La nourriture y reste quelques heures.',
        fact: 'L’acide de ton estomac est si fort que l’estomac se protège avec une couche de mucus gluant !',
      },
      nl: {
        name: 'De maag',
        info: 'Je maag is een rekbare zak die eten mengt met sterke sappen, tot er een soort dikke soep ontstaat. Het eten blijft er een paar uur in.',
        fact: 'Je maagzuur is zo sterk dat je maag zichzelf beschermt met een laagje glibberig slijm!',
      },
    },
    liver: {
      system: 'digestive',
      en: {
        name: 'Liver',
        info: 'The liver is a big, hard-working organ. It cleans your blood, stores energy and makes bile, a juice that helps digest fat.',
        fact: 'The liver can grow back if a piece of it is removed!',
      },
      fr: {
        name: 'Le foie',
        info: 'Le foie est un grand organe très travailleur. Il nettoie ton sang, stocke de l’énergie et fabrique la bile, un jus qui aide à digérer les graisses.',
        fact: 'Le foie peut repousser si on en enlève un morceau !',
      },
      nl: {
        name: 'De lever',
        info: 'De lever is een groot, hardwerkend orgaan. Ze reinigt je bloed, slaat energie op en maakt gal, een sap dat helpt om vet te verteren.',
        fact: 'De lever kan teruggroeien als er een stuk van wordt weggehaald!',
      },
    },
    pancreas: {
      system: 'digestive',
      en: {
        name: 'Pancreas',
        info: 'The pancreas sits behind your stomach. It makes juices that help digest food, and insulin, which controls the amount of sugar in your blood.',
        fact: 'Your pancreas makes about a litre of digestive juice every day!',
      },
      fr: {
        name: 'Le pancréas',
        info: 'Le pancréas se cache derrière l’estomac. Il fabrique des sucs qui aident à digérer et l’insuline, qui contrôle la quantité de sucre dans le sang.',
        fact: 'Ton pancréas fabrique environ un litre de suc digestif chaque jour !',
      },
      nl: {
        name: 'De alvleesklier',
        info: 'De alvleesklier zit achter je maag. Ze maakt sappen die helpen bij de vertering, en insuline, die de hoeveelheid suiker in je bloed regelt.',
        fact: 'Je alvleesklier maakt elke dag ongeveer een liter verteringssap!',
      },
    },
    smallIntestine: {
      system: 'digestive',
      en: {
        name: 'Small intestine',
        info: 'The small intestine is a long, twisty tube where most of your food is digested. Its walls take in the good stuff and send it into your blood.',
        fact: 'It’s called “small” because it’s thin, but it’s very long: about 6 metres in a grown-up, longer than a giraffe is tall!',
      },
      fr: {
        name: 'L’intestin grêle',
        info: 'L’intestin grêle est un long tuyau plein de virages où la plus grande partie de la nourriture est digérée. Ses parois absorbent ce qui est bon et l’envoient dans le sang.',
        fact: 'On le dit « grêle » parce qu’il est fin, mais il est très long : environ 6 mètres chez un adulte, plus qu’une girafe est haute !',
      },
      nl: {
        name: 'De dunne darm',
        info: 'De dunne darm is een lange, kronkelende buis waar het meeste eten wordt verteerd. De wanden nemen de goede stoffen op en sturen ze naar je bloed.',
        fact: 'Hij heet “dun” omdat hij smal is, maar hij is heel lang: ongeveer 6 meter bij een volwassene, langer dan een giraf hoog is!',
      },
    },
    largeIntestine: {
      system: 'digestive',
      en: {
        name: 'Large intestine',
        info: 'The large intestine takes water back from what is left of your food and turns the rest into poo. Lots of friendly bacteria live there and help keep you healthy.',
        fact: 'Your gut is home to trillions of bacteria, about as many as all the cells in your body!',
      },
      fr: {
        name: 'Le gros intestin',
        info: 'Le gros intestin récupère l’eau de ce qui reste de la nourriture et transforme le reste en caca. Plein de gentilles bactéries y vivent et t’aident à rester en bonne santé.',
        fact: 'Ton intestin abrite des milliers de milliards de bactéries, à peu près autant que toutes les cellules de ton corps !',
      },
      nl: {
        name: 'De dikke darm',
        info: 'De dikke darm haalt water uit de resten van je eten en maakt van de rest poep. Er leven heel veel vriendelijke bacteriën die je helpen gezond te blijven.',
        fact: 'In je darmen wonen duizenden miljarden bacteriën, ongeveer evenveel als alle cellen van je lichaam!',
      },
    },

    /* ───────────── Kidneys & bladder ───────────── */
    kidneys: {
      system: 'urinary',
      en: {
        name: 'Kidneys',
        info: 'Your two bean-shaped kidneys clean your blood. They filter out waste and extra water, which become pee (urine).',
        fact: 'Each kidney is about as big as your fist, and together they filter all your blood many times a day!',
      },
      fr: {
        name: 'Les reins',
        info: 'Tes deux reins, en forme de haricot, nettoient ton sang. Ils filtrent les déchets et l’eau en trop, qui deviennent le pipi (l’urine).',
        fact: 'Chaque rein est à peu près grand comme ton poing, et ensemble ils filtrent tout ton sang de nombreuses fois par jour !',
      },
      nl: {
        name: 'De nieren',
        info: 'Je twee boonvormige nieren maken je bloed schoon. Ze filteren afvalstoffen en extra water eruit, en daarvan maken ze plas (urine).',
        fact: 'Elke nier is ongeveer zo groot als je vuist, en samen filteren ze al je bloed vele keren per dag!',
      },
    },
    bladder: {
      system: 'urinary',
      en: {
        name: 'Bladder',
        info: 'The bladder is a stretchy bag that stores pee until you go to the toilet. Two thin tubes called ureters bring the pee down from your kidneys.',
        fact: 'When your bladder is about half full, it sends a message to your brain: time to find a toilet!',
      },
      fr: {
        name: 'La vessie',
        info: 'La vessie est une poche élastique qui garde le pipi jusqu’à ce que tu ailles aux toilettes. Deux petits tuyaux, les uretères, y amènent le pipi depuis les reins.',
        fact: 'Quand ta vessie est à moitié pleine, elle envoie un message au cerveau : il est temps de trouver des toilettes !',
      },
      nl: {
        name: 'De blaas',
        info: 'De blaas is een rekbare zak die je plas bewaart tot je naar het toilet gaat. Twee dunne buisjes, de urineleiders, brengen de plas van je nieren naar je blaas.',
        fact: 'Als je blaas ongeveer halfvol is, stuurt ze een berichtje naar je hersenen: tijd om een toilet te zoeken!',
      },
    },
  };

  const api = { SYSTEMS, PARTS };
  root.BodyContent = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
