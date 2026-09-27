import { Link } from 'react-router-dom'
import styles from './About.module.css'

export default function About() {
  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <h1 className={styles.title}>About the Data</h1>

        <p className={styles.lede}>
          Wastedata shows how much waste each of California's 400-plus jurisdictions —
          cities, unincorporated county areas, and regional waste authorities — sends to
          disposal, and lets you compare any two of them side by side. Everything on the
          site is built from public data published by the State of California.
        </p>

        <h2>Disposal tonnage</h2>
        <p>
          The tonnage figures come from CalRecycle's{' '}
          <a
            href="https://www2.calrecycle.ca.gov/RecyclingDisposalReporting/Reports/OverallJurisdictionTonsForDisposal"
            target="_blank"
            rel="noreferrer"
          >
            Recycling and Disposal Reporting System
          </a>
          , which every jurisdiction reports into each quarter. They count the waste that
          reached a permitted disposal facility: a landfill, a transformation
          (waste-to-energy) plant, or an engineered municipal solid waste conversion
          facility. Material that was recycled or composted is not included, so these
          numbers describe disposal, not everything a community throws away. Statewide,
          roughly two-fifths of what Californians discard is diverted through recycling
          and composting, which means the figures here cover only part of the total
          waste stream.
        </p>

        <h2>Per-person rates</h2>
        <p>
          To make jurisdictions of different sizes comparable, each quarter's tonnage is
          converted to pounds per person per day: tons × 2,000, divided by the 91.25 days
          in an average quarter, divided by the jurisdiction's population. Population
          figures are the{' '}
          <a
            href="https://dof.ca.gov/forecasting/demographics/estimates/"
            target="_blank"
            rel="noreferrer"
          >
            California Department of Finance
          </a>
          's annual estimates for cities and counties. Per-person figures are a useful
          yardstick but not a verdict: a jurisdiction with many commuters, visitors, or
          heavy construction and industrial activity can dispose of a lot of waste
          relative to its resident population.
        </p>

        <h2>Material composition</h2>
        <p>
          The donut charts show the estimated makeup of each jurisdiction's disposed
          waste: organics, paper, plastic, and so on. These come from CalRecycle's{' '}
          <a
            href="https://www2.calrecycle.ca.gov/WasteCharacterization/"
            target="_blank"
            rel="noreferrer"
          >
            waste characterization studies
          </a>
          , which physically sort and weigh samples of waste and then apply the results
          to local population and employment data. They are estimates, not measurements
          of any one community's waste, and because the studies are conducted
          periodically rather than every quarter, the breakdown does not change with the
          year and quarter selectors. Where no jurisdiction-specific estimate is
          available, the statewide breakdown is shown.
        </p>

        <p className={styles.note}>
          Spotted a problem, or have a question about the numbers?{' '}
          <Link to="/contact-us">Get in touch</Link>.
        </p>
      </article>
    </main>
  )
}
