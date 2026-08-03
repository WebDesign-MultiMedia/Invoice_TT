"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const WIDTH = 600;
const HEIGHT = 320;
const MARGIN = { top: 24, right: 16, bottom: 80, left: 56 };

export default function ServiceTypeChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", WIDTH / 2)
        .attr("y", HEIGHT / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", 13)
        .text("No service data yet");
      return;
    }

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.type))
      .range([0, innerWidth])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.revenue) || 1])
      .nice()
      .range([innerHeight, 0]);

    const yAxis = g.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${d3.format(",.0f")(d)}`)
    );
    yAxis.select(".domain").attr("stroke", "#334155");
    yAxis.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);

    g.selectAll(".tick line").attr("stroke", "#334155");

    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x));
    xAxis.select(".domain").attr("stroke", "#334155");
    xAxis
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .each(function each(d) {
        const label = d.length > 18 ? `${d.slice(0, 18)}…` : d;
        d3.select(this).text(label);
      })
      .append("title")
      .text((d) => d);

    g.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.type))
      .attr("y", (d) => y(d.revenue))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.revenue))
      .attr("rx", 4)
      .attr("fill", "#3b82f6");

    g.selectAll(".bar-label")
      .data(data)
      .join("text")
      .attr("x", (d) => x(d.type) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.revenue) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", 10)
      .attr("font-weight", 600)
      .text((d) => `$${d3.format(",.0f")(d.revenue)}`);
  }, [data]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Revenue by service type" />
  );
}
