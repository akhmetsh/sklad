import bwipjs from "bwip-js/node";

interface BarcodeProps {
  value: string;
  /** "code128" works for any alphanumeric SKU; "ean13" only for 12-digit numeric codes (13th is checksum) */
  type?: "code128" | "ean13";
  height?: number;
  scale?: number;
  showText?: boolean;
  className?: string;
}

export function Barcode({ value, type = "code128", height = 12, scale = 2, showText = true, className }: BarcodeProps) {
  if (!value) return null;

  let svg = "";
  try {
    svg = bwipjs.toSVG({
      bcid: type,
      text: value,
      scale,
      height,
      includetext: showText,
      textxalign: "center",
      textsize: 10,
      paddingwidth: 5,
      paddingheight: 5,
      backgroundcolor: "ffffff",
    });
  } catch {
    return <div className="text-xs text-red-500">Barcode error: {value}</div>;
  }

  return (
    <div
      className={className}
      // eslint-disable-next-line @next/next/no-img-element
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
