<script>
  import { untrack } from 'svelte';

  let { onok, oncancel, initialValue = '' } = $props();

  let text = $state('');
  let inputEl = $state(null);

  $effect(() => {
    text = untrack(() => initialValue);
    if (inputEl) setTimeout(() => { inputEl.focus(); inputEl.select(); }, 0);
  });
</script>

<dialog open class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg mb-4">Set Name</h3>
    <input
      bind:this={inputEl}
      type="text"
      class="input input-bordered w-full"
      bind:value={text}
    />
    <div class="modal-action">
      <button class="btn btn-ghost btn-sm" onclick={() => { text = ''; }}>clear</button>
      <button class="btn btn-ghost" onclick={oncancel}>cancel</button>
      <button class="btn btn-primary" onclick={() => onok(text)}>ok</button>
    </div>
  </div>
  <button class="modal-backdrop" onclick={oncancel}>close</button>
</dialog>
