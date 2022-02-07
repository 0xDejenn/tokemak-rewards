import { ethers } from 'ethers';
import { RewardsByTokenDetails } from '../pages';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';
import styles from './RewardsByToken.module.css';

type RewardsByTokenProps = {
  cycleWindows: string;
  allRewardsByToken: RewardsByTokenDetails;
}

const RewardsByToken = (props: RewardsByTokenProps) => {
  const getRewardsByTokenComponent = () => {
    const detail = props.allRewardsByToken;
    const results = [];

    for (const tokenDetail of detail.rewardDetails) {
      const lp = tokenDetail.liquidityProvider;
      const ld = tokenDetail.liquidityDirector;
      const total = lp.add(ld);

      results.push(
        <Tr key={tokenDetail.token} id="responsiveRow">
          <Th scope="row" id="responsiveRowHeader">{tokenDetail.token}</Th>
          <Td>{ethers.utils.formatEther(total)}</Td>
          <Td>{ethers.utils.formatEther(lp)}</Td>
          <Td>{ethers.utils.formatEther(ld)}</Td>
        </Tr>
        )
    }
    return results;
  }
    
  const lpTotal = props.allRewardsByToken.lpTotal;
  const ldTotal = props.allRewardsByToken.ldTotal;
  const allTotal = lpTotal.add(ldTotal);

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Rewards by Token</h2>
      <p>{props.cycleWindows}</p>
      <Table className={styles.DetailTable}>
        <Thead>
          <Tr>
            <Th scope="col">Token</Th>
            <Th scope="col">Total</Th>
            <Th scope="col">Liquidity Provider</Th>
            <Th scope="col">Liquidity Director</Th>
          </Tr>
        </Thead>
        <Tbody>
          {getRewardsByTokenComponent()}
        </Tbody>
        <tfoot>
          <Tr className={styles.totals}>
            <Th scope="row" id="responsiveRowHeader">Totals</Th>
            <Td>{ethers.utils.formatEther(allTotal)}</Td>
            <Td>{ethers.utils.formatEther(lpTotal)}</Td>
            <Td>{ethers.utils.formatEther(ldTotal)}</Td>
          </Tr>
          <Tr className={styles.table_source}>
            <Td colSpan={4}>Source: Tokemak</Td>
          </Tr>
        </tfoot>
      </Table>
    </section>
  )
}

export default RewardsByToken;