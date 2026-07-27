import { AudioFeatures } from '../types';

export class Visualizer {
  private vuMeter: HTMLDivElement;

  private fftContainer: HTMLDivElement;
  private fftBars: HTMLDivElement[] = [];

  constructor(private container: HTMLElement) {
    this.vuMeter = document.createElement('div');
    this.vuMeter.style.width = '100px';
    this.vuMeter.style.height = '20px';
    this.vuMeter.style.backgroundColor = 'gray';
    container.appendChild(this.vuMeter);

    this.fftContainer = document.createElement('div');
    this.fftContainer.style.display = 'flex';
    this.fftContainer.style.alignItems = 'flex-end';
    this.fftContainer.style.width = '100%';
    this.fftContainer.style.height = '100px';
    container.appendChild(this.fftContainer);
  }

  public renderFFT(data: number[]) {
    if (this.fftBars.length !== data.length) {
      this.fftContainer.innerHTML = '';
      this.fftBars = data.map(() => {
        const bar = document.createElement('div');
        bar.style.flex = '1';
        bar.style.backgroundColor = 'blue';
        this.fftContainer.appendChild(bar);
        return bar;
      });
    }

    data.forEach((value, i) => {
      this.fftBars[i].style.height = `${(value / 255) * 100}%`;
    });
  }

  public renderVuMeter(rms: number) {
    const width = Math.min(100, rms) + '%';
    this.vuMeter.style.width = width;
  }
}
