import "./styles.css";

type Props = {
  width?: React.CSSProperties["width"];
  height?: React.CSSProperties["height"];
  borderColor?: React.CSSProperties["color"];
};

export default function Spinner({ width, height, borderColor }: Props) {
  return (
    <span
      style={{
        width,
        height,
        borderColor,
      }}
      className="loader"
    ></span>
  );
}
