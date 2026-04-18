import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Button } from '../components/ui/Button';
import { listSessions, deleteSession } from '../lib/storage';
import type { Session } from '../types/session';

export function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const all = await listSessions();
    setSessions(all);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту работу? Восстановить не получится.')) return;
    await deleteSession(id);
    reload();
  };

  return (
    <Shell maxWidth="content">
      <div className="mb-10">
        <div className="meta-label mb-4">Личное хранилище</div>
        <h1 className="mb-4">Мои прошлые работы</h1>
        <p className="text-ink-700 max-w-2xl leading-relaxed text-pretty">
          Здесь хранятся все завершённые сессии. Возвращайся к ним через месяцы —
          сравнение с прошлой версией себя часто бывает интереснее самого результата.
        </p>
      </div>

      {loading ? (
        <div className="text-ink-600 italic">загружается…</div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="paper-card p-8 text-center">
          <p className="text-ink-600 italic mb-6">пока пусто</p>
          <Link to="/">
            <Button variant="secondary">Выбрать методику</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="paper-card p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap mb-1">
                  <span className="font-display text-lg">
                    {methodLabel(s.method)}
                  </span>
                  <span className="meta-label">{trackLabel(s.track)}</span>
                </div>
                <div className="text-sm text-ink-600">
                  {formatDate(s.startedAt)} ·{' '}
                  {s.completedAt ? 'завершено' : 'не завершено'}
                  {s.formula && s.formula.length > 0 && ` · ${s.formula.length} в формуле`}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {/* Reopen is a v2 feature — for now just delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id)}
                  aria-label="Удалить сессию"
                >
                  удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-paper-300">
        <Link to="/" className="meta-label hover:text-ink-800 transition-colors">
          ← к главной
        </Link>
      </div>
    </Shell>
  );
}

function methodLabel(method: string): string {
  switch (method) {
    case 'F7': return 'Формула-7';
    case 'F5': return 'Формула-5';
    case 'KCHG': return 'Кто? Что? Где?';
    case 'PEREKRESTOK': return 'Перекрёсток';
    default: return method;
  }
}

function trackLabel(track: string): string {
  return track === 'activating' ? 'активизирующий трек' : 'закрытый трек';
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toISOString();
  }
}
