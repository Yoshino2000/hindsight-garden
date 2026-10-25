# Time Garden 0.13.0

- The large garden's page buttons sit on the left and motion controls on the right of one wrapping toolbar. The long motion explanation remains available as a tooltip/accessibility description.
- One clipping wrapper removes 5.5% of the scene width from its empty upper strip. All SVG and sprite coordinates, projection and island/flowerbed geometry remain unchanged. Miniature gardens keep their full original view.
- Twenty permanent achievement levels are presented as thirteen cards. Count groups are 5/10/25, 50/100 and 250/500/1,000. Diversity milestones are 2/4/8. White/silver/gold styling indicates earned tiers, and the drawer lists every original condition and earned date. The first flower and eight individual species remain separate cards.
- Grouping only changes presentation. No persistent IDs, achievement revision, growth/storage logic or timestamps are rewritten. Missing lower tiers are never inferred from higher awards. The next unmet tier stays visible.
- A recommendation button fills only the editable new-flower name. It uses a currently available selected category/group, otherwise one of ten task names, plus the selected species. Multiple choices avoid an immediate repeat; one selected category intentionally yields the same name. Deleted or unreadable categories are excluded. Suggestions stay within the existing 40 UTF-16-unit limit without breaking surrogate pairs. Switching species never overwrites a manually edited name.
- Root README is Chinese, with an English visual counterpart. Detailed rules, permissions, upgrade and developer material stay in linked guides. New browser screenshots use synthetic fixtures, not private records.
- A flat five-colour flower/leaf/pot icon replaces the old icon. `scripts/make-icon.ps1` reproducibly draws the 256×256 PNG using System.Drawing; no generated bitmap or outside brand asset is used for this icon.

Permissions remain seven, storage 64 MB and archive schema 2. The final installable ZIP still requires native-host verification; browser preview is not an OS notification test.
