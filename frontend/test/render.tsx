import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

export async function render(ui: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  await act(async () => {
    root.render(ui);
  });

  return {
    container,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

export async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

export async function submit(form: HTMLFormElement) {
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

export async function inputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  descriptor?.set?.call(element, value);
  await act(async () => {
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
  });
}

export async function selectValue(element: HTMLSelectElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");

  descriptor?.set?.call(element, value);
  await act(async () => {
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

export async function checkboxValue(element: HTMLInputElement, checked: boolean) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");

  descriptor?.set?.call(element, checked);
  await act(async () => {
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

export function fieldByLabel<T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
  container: HTMLElement,
  labelText: string
): T {
  const labels = Array.from(container.querySelectorAll("label"));
  const label = labels.find((entry) => entry.textContent?.includes(labelText));
  const field = label?.querySelector("input, textarea, select");

  if (!field) {
    throw new Error(`Field with label "${labelText}" was not found`);
  }

  return field as T;
}
