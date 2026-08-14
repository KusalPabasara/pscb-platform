export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface Passage {
  id: string;
  title: string;
  text: string;
  questions: QuizQuestion[];
}

export const passages: Passage[] = [
  {
    id: 'harbor-clock',
    title: 'The Harbor Clock',
    text: `Mara arrived at the harbor before the first ferry sounded its horn. She had been asked to inspect the old clock above the ticket hall, which had lost seven minutes each day since the winter storms. The clock mattered to the town because fishers used its bell to mark the opening of the morning market. A late bell meant warm boxes, impatient buyers, and lower prices.

The mechanism looked clean at first. Its brass wheels were bright, the chain was tight, and the pendulum moved without a scrape. Mara watched for ten minutes and noticed that the clock slowed only when a delivery cart crossed the eastern ramp. Each wheel of the cart made the wall tremble. A narrow wooden shelf beside the clock shifted with it and touched the pendulum for less than a second.

Rather than replace the clock, Mara moved the shelf to the opposite wall and fitted two small cork pads behind the case. She then asked the driver to cross the ramp three times. The pendulum kept its rhythm. At noon, the clock and Mara's pocket watch showed the same minute.

The market committee had expected a costly repair and seemed almost disappointed by the simple answer. Mara reminded them that a machine can be accurate and still be disturbed by its surroundings. The next morning the bell rang on time, the fish stayed cold, and no buyer knew why the ordinary sound had briefly become uncertain.`,
    questions: [
      { id: 'harbor-1', prompt: 'Why did the clock matter to the town?', choices: ['It controlled the ferry gates', 'Its bell opened the morning market', 'It measured the tide', 'It warned of storms'], correctIndex: 1 },
      { id: 'harbor-2', prompt: 'What caused the clock to lose time?', choices: ['A loose chain', 'Salt in the gears', 'A shelf touching the pendulum', 'A damaged bell'], correctIndex: 2 },
      { id: 'harbor-3', prompt: 'What material did Mara place behind the case?', choices: ['Cork', 'Leather', 'Rubber', 'Felt'], correctIndex: 0 },
    ],
  },
  {
    id: 'orchard-map',
    title: 'The Orchard Map',
    text: `Elias found the folded map inside a jar at the back of the orchard shed. His aunt had drawn it years earlier, marking each pear tree with a small green circle and every irrigation valve with a blue square. The northern row was missing from the page, although those trees produced more fruit than any others.

He first assumed the paper had torn. Along its upper edge, however, the fibers were smooth and the ink ended in a straight line. Elias carried the map outside and compared it with the field. The blue squares formed a repeating pattern: two near the path, one beside the stone wall, then two again. The sequence suggested that another piece of the map had once been folded underneath.

Back in the shed, he held the paper near the window. A faint set of green circles appeared through the lower margin, transferred when the wet ink had been folded. He mirrored those marks onto a fresh sheet and followed them to the northern row. Beneath a flat stone he found the missing valve, almost buried by grass. Opening it restored water to three dry trees at the end of the row.

His aunt laughed when Elias showed her the repaired map. She explained that she had cut away a stained corner and forgotten the hidden valve. Elias added the new sheet with linen tape and wrote the date beside it. The map was no longer original, but it was useful again, and the three trees produced a small late crop.`,
    questions: [
      { id: 'orchard-1', prompt: 'Where was the map found?', choices: ['Under a flat stone', 'Inside a jar in the shed', 'Beside the stone wall', 'In a market box'], correctIndex: 1 },
      { id: 'orchard-2', prompt: 'How did Elias infer missing information?', choices: ['He asked a neighbor', 'He followed bird tracks', 'He saw transferred ink in the margin', 'He measured the tree shadows'], correctIndex: 2 },
      { id: 'orchard-3', prompt: 'What happened after the valve was opened?', choices: ['The shed flooded', 'Three dry trees received water', 'The map became stained', 'The northern row was removed'], correctIndex: 1 },
    ],
  },
];

export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}
