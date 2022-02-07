import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';
import styles from './RewardsSummary.module.css';

type RewardsSummaryProps = {
  latestCycle: string,
  latestCycleRewards: string,
  lifetimeRewards: string
}

const RewardsSummary = (props: RewardsSummaryProps) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Rewards Summary</h2>
      <Table className={styles.SummaryTable}>
        <Thead>
          <Tr>
            <Th scope="col">Latest Cycle</Th>
            <Th scope="col">Latest Rewards</Th>
            <Th scope="col">Lifetime Rewards</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr id="responsiveRow">
            <Td>{props.latestCycle}</Td>
            <Td>{props.latestCycleRewards}</Td>
            <Td>{props.lifetimeRewards}</Td>
          </Tr>
        </Tbody>
        <tfoot>
          <Tr className={styles.table_source}>
            <Td colSpan={3}>Source: Tokemak</Td>
          </Tr>
        </tfoot>
      </Table>
    </section>
  );
}

export default RewardsSummary;