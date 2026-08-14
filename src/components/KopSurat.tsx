import Image from "next/image";

export default function KopSurat() {
  return (
    <div className="break-inside-avoid-page border-b-4 border-slate-800 px-4 pb-1.5 pt-2">
      <div className="flex items-start gap-4">
        <Image
          src="/logo-esdm.png"
          alt="Kementerian ESDM"
          width={52}
          height={63}
        />
        <div className="flex-1 pt-1 text-xs leading-tight">
          <p>KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL REPUBLIK INDONESIA</p>
          <p className="font-bold">BADAN GEOLOGI</p>
          <p>Jalan Diponegoro Nomor 57 Bandung 40122</p>
          <p>Jalan Jenderal Gatot Subroto Kav. 49 Jakarta 12950</p>
        </div>
        <table className="pt-1 text-xs leading-tight">
          <tbody>
            <tr>
              <td className="pr-1 align-top">T.</td>
              <td>(022) 7215297</td>
            </tr>
            <tr>
              <td></td>
              <td>(021) 5228371</td>
            </tr>
            <tr>
              <td className="pr-1 align-top">E.</td>
              <td>geologi@esdm.go.id</td>
            </tr>
            <tr>
              <td className="pr-1 align-top">W.</td>
              <td>www.esdm.go.id</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
