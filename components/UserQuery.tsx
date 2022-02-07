import styles from './UserQuery.module.css';

type UserQueryProps = {
  onChange: (address: string) => void;
  handleSubmit: () => void;
  preventQuery: boolean;
}

const UserQuery = (props: UserQueryProps) => {
  const addressOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange(e.target.value);
  };
  return (
    <section className={styles.UserQuery}>
      <input placeholder="Public Address" onChange={addressOnChange} />
      <button disabled={props.preventQuery} onClick={props.handleSubmit}>Query</button>
    </section>
  );
}

export default UserQuery;