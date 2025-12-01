import "./styles.css";

type Props = {
  width?: React.CSSProperties["width"];
  height?: React.CSSProperties["height"];
};

export default function Spinner({ width, height }: Props) {
  return (
    <span
      style={{
        width,
        height,
      }}
      className="loader"
    ></span>
  );
}
