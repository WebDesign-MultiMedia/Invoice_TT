"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const WIDTH = 600;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 56 };

export default function AvgTicketTrendChart({ data }) {
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
        .text("No ticket data yet");
      return;
    }

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.week))
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.avg) || 1])
      .nice()
      .range([innerHeight, 0]);

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(Math.min(data.length, 6)).tickFormat(d3.timeFormat("%b %d")));
    xAxis.select(".domain").attr("stroke", "#334155");
    xAxis.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);

    const yAxis = g.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => `$${d3.format(",.0f")(d)}`)
    );
    yAxis.select(".domain").attr("stroke", "#334155");
    yAxis.selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);

    g.selectAll(".tick line").attr("stroke", "#334155");

    const area = d3
      .area()
      .x((d) => x(d.week))
      .y0(innerHeight)
      .y1((d) => y(d.avg))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line()
      .x((d) => x(d.week))
      .y((d) => y(d.avg))
      .curve(d3.curveMonotoneX);

    g.append("path").datum(data).attr("fill", "#3b82f6").attr("fill-opacity", 0.15).attr("d", area);

    g.append("path").datum(data).attr("fill", "none").attr("stroke", "#60a5fa").attr("stroke-width", 2.5).attr("d", line);

    g.selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.week))
      .attr("cy", (d) => y(d.avg))
      .attr("r", 3.5)
      .attr("fill", "#60a5fa");
  }, [data]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label="Average ticket size by week"
    />
  );
}
