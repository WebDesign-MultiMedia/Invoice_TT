// Shared field-list logic for vehicle specifications, used by both the
// dashboard's VehicleSpecsCard and the public invoice page so the two
// don't each maintain their own copy of this mapping.
export function getVehicleSpecFields(vehicleDetails) {
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

  return { specs, airbags };
}
