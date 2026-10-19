// Geometry adapted from Lucide (ISC) and AnimateIcons (MIT). See NOTICE.md.
const path = d => ["path", { d }];
const circle = (cx, cy, r) => ["circle", { cx, cy, r }];
const rect = (x, y, width, height, rx = 1) => [
  "rect",
  { x, y, width, height, rx }
];
export const icons = {
  ArrowRightLeft: [path("M3 7h18m-4-4 4 4-4 4"), path("M21 17H3m4-4-4 4 4 4")],
  History: [
    path("M3 12a9 9 0 1 0 2.64-6.36L3 8"),
    path("M3 3v5h5"),
    path("M12 7v5l3 2")
  ],
  StickyNote: [
    path("M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11l5-5V5a2 2 0 0 0-2-2Z"),
    path("M16 21v-5h5"),
    path("M7 8h10m-10 4h6")
  ],
  Files: [
    rect(8, 2, 12, 16, 2),
    path("M16 18v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4")
  ],
  Printer: [
    path("M6 9V3h12v6"),
    path(
      "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
    ),
    rect(6, 14, 12, 8)
  ],
  LayoutDashboard: [
    rect(3, 3, 7, 9),
    rect(14, 3, 7, 5),
    rect(14, 12, 7, 9),
    rect(3, 16, 7, 5)
  ],
  MessageSquare: [
    path(
      "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
    ),
    path("M7 7h8"),
    path("M7 11h10"),
    path("M7 15h6")
  ],
  MessageCircle: [
    path("M7.9 20A9 9 0 1 0 4 16.1L2 22Z"),
    path("M8 9h8"),
    path("M8 13h5")
  ],
  Users: [
    circle(9, 7, 4),
    path("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"),
    path("M16 3.13a4 4 0 0 1 0 7.75"),
    path("M22 21v-2a4 4 0 0 0-3-3.87")
  ],
  UserRound: [circle(12, 8, 5), path("M20 21a8 8 0 0 0-16 0")],
  Contact: [
    rect(3, 3, 18, 18, 2),
    circle(12, 9, 2),
    path("M8 16a4 4 0 0 1 8 0"),
    path("M7 2v2m10-2v2")
  ],
  Settings: [
    path(
      "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
    ),
    circle(12, 12, 3)
  ],
  Workflow: [
    rect(3, 3, 6, 6),
    path("M6 9v6a3 3 0 0 0 3 3h6"),
    rect(15, 15, 6, 6)
  ],
  Zap: [path("m13 2-3 8H3l8 12 3-8h7L13 2Z")],
  CircleHelp: [
    circle(12, 12, 10),
    path("M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"),
    path("M12 17h.01")
  ],
  Calendar: [
    rect(3, 5, 18, 16, 2),
    path("M16 3v4m-8-4v4"),
    path("M3 11h18"),
    path("M8 15h2m4 0h2m-8 3h2")
  ],
  Tag: [
    path("M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"),
    circle(7, 7, 1)
  ],
  List: [
    path("M8 6h13"),
    path("M8 12h13"),
    path("M8 18h13"),
    path("M3 6h.01m-.01 6h.01m-.01 6h.01")
  ],
  Megaphone: [
    path("m3 11 18-5v12L3 14v-3Z"),
    path("m7 15 2 6h3l-2-5"),
    path("M21 9v6")
  ],
  ReceiptText: [
    path(
      "M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5Z"
    ),
    path("M8 8h8"),
    path("M8 12h8"),
    path("M8 16h5")
  ],
  Banknote: [
    rect(2, 6, 20, 12, 2),
    circle(12, 12, 2),
    path("M6 12h.01M18 12h.01")
  ],
  Pencil: [
    path("m16 3 5 5M3 21l4-1L21 6a2.83 2.83 0 0 0-4-4L3 16v5Z"),
    path("m3 16 5 5")
  ],
  Refresh: [
    path("M3 11a9 9 0 0 1 15.4-6.4L21 7"),
    path("M21 3v4h-4"),
    path("M21 13a9 9 0 0 1-15.4 6.4L3 17"),
    path("M7 17H3v4")
  ],
  Plus: [path("M5 12h14"), path("M12 5v14")],
  X: [path("m6 6 12 12"), path("M18 6 6 18")],
  Search: [circle(11, 11, 8), path("m21 21-4.3-4.3")],
  Archive: [
    rect(2, 3, 20, 4),
    path("M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"),
    path("M10 12h4")
  ],
  Send: [path("m22 2-7 20-4-9-9-4Z"), path("M22 2 11 13")],
  Paperclip: [
    path(
      "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.48l10.6-10.61a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.82l9.2-9.19"
    )
  ],
  Download: [
    path("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),
    path("M12 3v12"),
    path("m7 10 5 5 5-5")
  ],
  Mic: [
    rect(9, 2, 6, 12, 3),
    path("M5 10v2a7 7 0 0 0 14 0v-2"),
    path("M12 19v3m-4 0h8")
  ],
  Check: [path("m5 12 4 4L19 6")],
  Eye: [
    path("M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"),
    circle(12, 12, 3)
  ],
  Trash2: [
    path("M3 6h18"),
    path("M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
    path("m19 6-1 14H6L5 6"),
    path("M10 10v6m4-6v6")
  ]
};
