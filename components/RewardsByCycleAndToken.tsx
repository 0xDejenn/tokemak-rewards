import { BigNumber, ethers } from 'ethers';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';
import { RewardsByCycleAndToken } from '../pages';
// need to fix the module for this component.
import styles from './RewardsByToken.module.css';

type RewardsByCycleAndTokenProps = {
  allRewardsByCycleAndToken: RewardsByCycleAndToken[];
}

const RewardsByCycleAndToken = (props: RewardsByCycleAndTokenProps) => {
  const data = props.allRewardsByCycleAndToken;

  const getRewardsByCycleAndTokenComponent = data.map((rewardDetail, index) =>  {
    let lp = rewardDetail.liquidityProvider;
    let ld = rewardDetail.liquidityDirector;
    let total = lp.add(ld);
    
    return (
      <Tr key={index} id="responsiveRow">
        <Th scope="row" id="responsiveRowHeader">{rewardDetail.cycle}</Th>
        <Td>{rewardDetail.token}</Td>
        <Td>{ethers.utils.formatEther(total)}</Td>
        <Td>{ethers.utils.formatEther(lp)}</Td>
        <Td>{ethers.utils.formatEther(ld)}</Td>
      </Tr>
      ) 
    }
  )

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Rewards by Cycle and Token</h2>
      <Table>
        <Thead>
          <Tr>
            <Th>Cycle</Th>
            <Th>Token</Th>
            <Th>Total</Th>
            <Th>Liquidity Provider</Th>
            <Th>Liquidity Director</Th>
          </Tr>
        </Thead>
        <Tbody>{ getRewardsByCycleAndTokenComponent }</Tbody>
        <tfoot>
          <Tr className={styles.table_source}>
            <Td colSpan={5}>Source: Tokemak</Td>
          </Tr>
        </tfoot>
      </Table> 
    </section>
  )
}

export default RewardsByCycleAndToken;