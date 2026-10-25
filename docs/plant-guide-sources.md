# Plant guide: sources and scope

Checked on **2026-10-25**. The built-in Chinese reading cards are in `ui/plant-guide.js`. Each entry contains `botanical`, `origin`, `story`, `meaning` and two or three `sources` (`label`, `url`). This module is static data: no fetch, outside scripts or runtime network dependency. The UI may show institution names; full source links remain available here and in the data, without assuming the host iframe can open new tabs.

The eight illustrations are original stylized art, not botanical identification plates. Names below identify a representative species or a broad garden genus, not the precise species, cultivar or ancestry of the image. In particular, the plugin's “玫瑰” means garden roses of *Rosa*, not an identification as *Rosa rugosa*. Hydrangea origin refers to *H. macrophylla*, not to the entire genus.

Origins, natural history and garden history are factual summaries, written originally in Chinese rather than long translations. Symbolic meanings are cultural interpretation, not scientific properties or a universal code. Four entries identify a specific historical flower-language source; the other four explicitly say **本花园寓意** or **本花园赋予**, so the plugin's own positive associations are not presented as ancient tradition.

## Evidence by plant

### Sunflower / 向日葵

- **Representative**: *Helianthus annuus*.
- **Origin**: [NC State Extension Gardener Plant Toolbox — Helianthus annuus](https://plants.ces.ncsu.edu/plants/helianthus-annuus/), Description. It identifies an annual member of Asteraceae, native to the western United States and parts of Mexico and introduced widely; its text also mentions roadsides and fields.
- **Story**: [UC Davis — Sunflowers Move by the Clock](https://www.ucdavis.edu/news/sunflowers-move-clock), “Clocks and two growth mechanisms” and “Why face the sun?”. Young plants track the sun; mature flowers settle facing east. The university reports warmer east-facing heads and greater pollinator visitation in experiments. The card avoids a claim that every mature sunflower follows the sun all day.
- **Meaning**: “向光与耐心” is an original Time Garden association, not a claimed traditional or scientific meaning.

### Hydrangea / 绣球

- **Representative**: *Hydrangea macrophylla*.
- **Origin**: [Kew Plants of the World Online — Hydrangea macrophylla](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:791637-1/general-information), accepted name and native range. The range is south-central Japan to Izu Ōshima and Kazan Rettō. The card deliberately summarizes at country level.
- **Story**: [RHS — How to grow shrubby hydrangeas](https://www.rhs.org.uk/plants/hydrangea/shrubby/growing-guide), “Choosing a shrubby hydrangea”. Certain mophead/lacecap forms change blue/pink with pH-dependent aluminium availability; not all cultivars change. The card does not treat pH alone as a universal colour switch. The same guide describes the garden flower-head forms.
- **Meaning**: “相聚与感谢” is this garden's own interpretation. It is not attributed to Japanese folklore, an emperor or an invented apology legend.

### Tulip / 郁金香

- **Scope**: *Tulipa*, garden imagery without a cultivar assignment. [RHS — Tulip genus guide](https://www.rhs.org.uk/plants/tulip) gives the botanical genus and the diversity of flower forms.
- **Origin and story**: [National Trust — The history of tulips](https://www.nationaltrust.org.uk/discover/history/gardens-landscapes/history-of-tulips), “The origins of tulips” and “‘Tulipmania’”. It identifies Central Asia as an important native region, cultivation in Ottoman palace gardens by the fourteenth century, and seventeenth-century European collecting. The card does not give a falsely precise first departure from Asia or reduce the genus's native range to the Netherlands.
- **Meaning**: [Kate Greenaway — Language of Flowers, “Tulip, Red”](https://www.gutenberg.org/cache/epub/31591/pg31591-images.html), nineteenth-century flower list: a declaration of love. The card explicitly limits that association to red tulips in this historical source, without identifying the artwork's colour or cultivar botanically.

### Daisy / 雏菊

- **Representative and origin**: [Kew Plants of the World Online — Bellis perennis](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:184409-1/general-information), accepted perennial with native range Madeira, Europe to the Mediterranean and Central Asia.
- **Story**: [University of Oxford, Plants 400 — Bellis perennis](https://herbaria.plants.ox.ac.uk/bol/plants400/Profiles/AB/Bellis), paragraphs on close-cropped grassland and the daytime opening of flower heads. It traces “daisy” to Old English “day's eye”. The card's “草坪睁眼” is an original metaphor for this recorded behaviour, not a quotation from Oxford.
- **Meaning**: [Greenaway — Language of Flowers, “Daisy”](https://www.gutenberg.org/cache/epub/31591/pg31591-images.html): innocence. The card marks it as a historical cultural association, not a worldwide consensus.

### Rose / 玫瑰

- **Scope, origin and story**: [University of Illinois Extension — Roses Types](https://extension.illinois.edu/roses/roses-types), opening botanical discussion, “Species Roses” and “China Roses”. Wild *Rosa* occur in the Northern Hemisphere. Modern garden classes have complex hybrid ancestry; China roses contributed recurrent flowering, and the page discusses ‘Old Blush’ in hybridization. The card does not claim all garden roses are one species or all originate in one country.
- **Meaning**: [Greenaway — Language of Flowers, “Rose” and colour-specific entries](https://www.gutenberg.org/cache/epub/31591/pg31591-images.html): the general rose represents love, with other meanings assigned to named colours/forms. The card's “珍爱” is a warm paraphrase of that cultural association, with its historical scope stated.

### Lavender / 薰衣草

- **Representative and origin**: [Kew Plants of the World Online — Lavandula angustifolia](https://powo.science.kew.org/taxon/449008-1), accepted name, Lamiaceae, native range north-eastern Spain to Italy.
- **Story**: [Muséum national d'Histoire naturelle — Lavande vraie](https://www.mnhn.fr/fr/lavande-vraie), “Comment reconnaître la lavande vraie ?” and “Lavande ou lavandin ?”. It describes the Mediterranean mountain setting and distinguishes true lavender from natural hybrid lavandin, *Lavandula × intermedia*, whose parents are *L. angustifolia* and *L. latifolia*. The card does not identify the artwork or every purple field as either parent or hybrid.
- **Meaning**: “安静与休息” is explicitly a Time Garden association. No therapeutic benefit or historical “waiting for love” legend is asserted.

### Cosmos / 波斯菊

- **Representative and origin**: [Singapore NParks Flora & Fauna Web — Cosmos bipinnatus](https://www.nparks.gov.sg/florafaunaweb/flora/3/6/3683), classification, biogeography and landscaping sections. It records Mexico as the native distribution, an annual herb, park/border use, and a compound flower head with ray and disc florets. Its Chinese common-name record includes 秋英. The card does not infer origin from the name “波斯菊”.
- **Story**: [University of California, Irvine, natural-history collection — Cosmos bipinnatus](https://nathistoc.bio.uci.edu/Plants%20of%20Upper%20Newport%20Bay%20(Robert%20De%20Ruff)/Asteraceae/Cosmos%20bipinnatus.htm), Name section. The Greek name has a root sense of orderliness. The flower-head structure is corroborated by NParks. This etymology is not presented as evidence of a traditional flower language.
- **Meaning**: “自在与秩序” is an original Time Garden interpretation, clearly marked as such.

### Lily / 百合

- **Scope and origin**: [RHS — Lilies genus guide](https://www.rhs.org.uk/plants/lilies), botanical name *Lilium* and its wide range of habitats in North America, Europe and Asia. The illustration is not assigned to a particular species or cultivar.
- **Story**: [Iowa State University Extension — How to Propagate Garden Lilies](https://yardandgarden.extension.iastate.edu/how-to/how-propagate-garden-lilies), “Scaling”. Bulb scales can produce bulblets at their bases under suitable conditions. The card is a natural-history vignette, not a full propagation protocol or a promise that a leaf will root.
- **Meaning**: [Greenaway — Language of Flowers, “Lily, White”](https://www.gutenberg.org/cache/epub/31591/pg31591-images.html): purity and sweetness. This is a colour-qualified historical interpretation, not a botanical diagnostic feature or a claim about all lilies in all cultures.

## Historical flower-language boundary

The historical source is Kate Greenaway's *Language of Flowers*, London, George Routledge and Sons, **1884**. The [Biodiversity Heritage Library catalogue, contributed by Smithsonian Libraries and Archives](https://www.biodiversitylibrary.org/item/269449) records this edition and marks the work public domain; [Project Gutenberg's edition page](https://www.gutenberg.org/ebooks/31591) identifies the author and records US public-domain status. The actual alphabetical text, not its automatically generated modern summary, was used to verify the four retained associations. No original illustrations or long passages are copied into the plugin.

The same nineteenth-century book gives hydrangea and lavender meanings unlike many modern positive lists, illustrating why a single universal flower-language claim would be misleading. Rather than replacing history with an invented legend, Time Garden labels its hydrangea, lavender, sunflower and cosmos meanings as its own creative associations. The factual origin/story sources do not endorse these custom meanings.

## Verification notes

- Source pages were opened and relevant sections checked on the date above. The BHL catalogue metadata was available through its search index, while direct access returned HTTP 403; the public text was verified directly at Gutenberg. Kew's general plant-story pages also returned HTTP 403 and are not used as the card sources; the cited Kew POWO records opened successfully.
- Chinese text is an original short synthesis. No contemporary source contributes a long quotation. The card does not reproduce a medical claim, edible-plant instruction or unsupported ancient myth.
- URLs are reference data, not third-party scripts or a required download. Contents and access may change after this check. The plugin remains usable offline; access to a website is separate from reading the built-in card.
