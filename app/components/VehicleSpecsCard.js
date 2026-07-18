export default function VehicleSpecsCard({ vin, vehicleDetails }) {
  const vd = vehicleDetails || {};
  const plantLocation = [vd.plantCity, vd.plantState, vd.plantCountry].filter(Boolean).join(", ");

  const specs = [
    ["Manufacturer", vd.manufacturer],
    ["Vehicle Type", vd.vehicleType],
    ["Body Class", vd.bodyClass],
    ["Series", vd.series],
    ["Trim", vd.trim],
    ["GVWR", vd.gvwr],
    ["Drive Type", vd.driveType],
    ["Cylinders", vd.cylinders],
    ["Primary Fuel Type", vd.primaryFuel],
    ["Electrification Level", vd.electrificationLevel],
    ["Secondary Fuel Type", vd.secondaryFuel],
    ["Engine Model", vd.engineModel],
    ["Engine Brake (HP)", vd.engineHp],
    ["Engine Manufacturer", vd.engineManufacturer],
    ["Displacement (L)", vd.displacement],
    ["Transmission Speeds", vd.transmissionSpeeds],
    ["Transmission Style", vd.transmissionStyle],
    ["Plant Location", plantLocation],
  ].filter(([, value]) => value);

  const airbags = [
    ["Front", vd.airbagFront],
    ["Knee", vd.airbagKnee],
    ["Side", vd.airbagSide],
    ["Curtain", vd.airbagCurtain],
    ["Seat Cushion", vd.airbagSeatCushion],
    ["Other Restraint Info", vd.otherRestraintInfo],
  ].filter(([, value]) => value);

  if (!vin && specs.length === 0 && airbags.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Full Vehicle Specifications
      </p>

      <div className="space-y-1 text-slate-300">
        {vin && (
          <p>
            <span className="text-slate-500">Car VIN:</span> {vin}
          </p>
        )}
        {specs.map(([label, value]) => (
          <p key={label}>
            <span className="text-slate-500">{label}:</span> {value}
          </p>
        ))}
      </div>

      {airbags.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-2">
          <p className="mb-1 text-xs font-semibold text-slate-300">Airbags</p>
          <ul className="list-disc space-y-0.5 pl-4 text-slate-300">
            {airbags.map(([label, value]) => (
              <li key={label}>
                <span className="text-slate-500">{label}:</span> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
